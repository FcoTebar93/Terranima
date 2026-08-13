<?php
/**
 * Autenticación y serialización de usuarios Terranima.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Auth
{
    /**
     * @param int|\WP_User|null $user
     */
    public static function user_can_access($user = null)
    {
        if ($user === null) {
            $user = wp_get_current_user();
        } elseif (is_numeric($user)) {
            $user = get_user_by('id', (int) $user);
        }

        if (!$user instanceof WP_User || !$user->exists()) {
            return false;
        }

        $activo = get_user_meta($user->ID, Terranima_Roles::META_ACTIVO, true);
        if ($activo !== '' && $activo !== false && (int) $activo === 0) {
            return false;
        }

        return user_can($user, Terranima_Roles::CAP_ACCESS);
    }

    /**
     * @param int|\WP_User|null $user
     * @return int Terranima_Roles::TIPO_FAMILIA|TERRANIMA_Roles::TIPO_PROFESIONAL
     */
    public static function get_tipo($user = null)
    {
        if ($user === null) {
            $user = wp_get_current_user();
        } elseif (is_numeric($user)) {
            $user = get_user_by('id', (int) $user);
        }

        if (!$user instanceof WP_User || !$user->exists()) {
            return Terranima_Roles::TIPO_FAMILIA;
        }

        if (in_array(Terranima_Roles::ROLE_PROFESIONAL, (array) $user->roles, true)) {
            return Terranima_Roles::TIPO_PROFESIONAL;
        }

        if (in_array(Terranima_Roles::ROLE_FAMILIA, (array) $user->roles, true)) {
            return Terranima_Roles::TIPO_FAMILIA;
        }

        $meta = (int) get_user_meta($user->ID, Terranima_Roles::META_TIPO, true);
        if ($meta === Terranima_Roles::TIPO_PROFESIONAL) {
            return Terranima_Roles::TIPO_PROFESIONAL;
        }

        return Terranima_Roles::TIPO_FAMILIA;
    }

    /**
     * @return string
     */
    public static function get_display_name(WP_User $user)
    {
        $name = trim($user->display_name);
        if ($name !== '') {
            return $name;
        }

        $first = trim((string) get_user_meta($user->ID, 'first_name', true));
        $last = trim((string) get_user_meta($user->ID, 'last_name', true));
        $combined = trim($first . ' ' . $last);

        return $combined !== '' ? $combined : $user->user_login;
    }

    /**
     * Convierte slug de especialidad a etiqueta legible para la UI.
     *
     * @param string $slug
     * @return string|null
     */
    public static function especialidad_label($slug)
    {
        if ($slug === '') {
            return null;
        }

        $map = Terranima_Roles::especialidades();
        if (isset($map[$slug])) {
            return $map[$slug];
        }

        return $slug;
    }

    /**
     * Serializa el usuario al formato consumido por la SPA.
     *
     * @param int|\WP_User|null $user
     * @return array<string, mixed>|WP_Error
     */
    public static function serialize_user($user = null)
    {
        if ($user === null) {
            $user = wp_get_current_user();
        } elseif (is_numeric($user)) {
            $user = get_user_by('id', (int) $user);
        }

        if (!$user instanceof WP_User || !$user->exists()) {
            return new WP_Error('terranima_not_logged_in', __('No has iniciado sesión.', 'terranima-profile'), array('status' => 401));
        }

        if (!self::user_can_access($user)) {
            return new WP_Error('terranima_forbidden', __('Tu cuenta no tiene acceso al área Terranima.', 'terranima-profile'), array('status' => 403));
        }

        $tipo = self::get_tipo($user);
        $especialidad_slug = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
        $especialidad = $tipo === Terranima_Roles::TIPO_PROFESIONAL
            ? self::especialidad_label($especialidad_slug)
            : null;

        return array(
            'id'          => (int) $user->ID,
            'name'        => self::get_display_name($user),
            'email'       => $user->user_email,
            'tipo'        => $tipo,
            'role'        => $tipo === Terranima_Roles::TIPO_PROFESIONAL ? 'profesional' : 'tutor',
            'numeroSocio' => (string) get_user_meta($user->ID, Terranima_Roles::META_NUMERO_SOCIO, true),
            'direccion'   => (string) get_user_meta($user->ID, Terranima_Roles::META_DIRECCION, true),
            'especialidad'=> $especialidad,
        );
    }

    /**
     * @param string $email_or_login
     * @param string $password
     * @return WP_User|WP_Error
     */
    public static function authenticate($email_or_login, $password)
    {
        $email_or_login = sanitize_text_field($email_or_login);
        $password = (string) $password;

        if ($email_or_login === '' || $password === '') {
            return new WP_Error('terranima_missing_credentials', __('Introduce correo y contraseña.', 'terranima-profile'), array('status' => 400));
        }

        $user = get_user_by('email', $email_or_login);
        if (!$user) {
            $user = get_user_by('login', $email_or_login);
        }

        if (!$user) {
            return new WP_Error('terranima_invalid_credentials', __('No hemos podido reconocer esas credenciales.', 'terranima-profile'), array('status' => 401));
        }

        // Evita conflictos con cookies de sesión antiguas o corruptas.
        wp_clear_auth_cookie();

        $signed = wp_signon(
            array(
                'user_login'    => $user->user_login,
                'user_password' => $password,
                'remember'      => true,
            ),
            is_ssl()
        );

        if (is_wp_error($signed)) {
            return new WP_Error('terranima_invalid_credentials', __('No hemos podido reconocer esas credenciales.', 'terranima-profile'), array('status' => 401));
        }

        if (!self::user_can_access($signed)) {
            wp_logout();
            return new WP_Error('terranima_forbidden', __('Tu cuenta no tiene acceso al área Terranima.', 'terranima-profile'), array('status' => 403));
        }

        return $signed;
    }

    public static function logout()
    {
        wp_logout();
    }

    /**
     * Config inyectada en la SPA.
     *
     * @return array<string, string>
     */
    public static function frontend_config()
    {
        return array(
            'restUrl'    => esc_url_raw(rest_url('terranima/v1')),
            'nonce'      => wp_create_nonce('wp_rest'),
            'profileUrl' => esc_url_raw(home_url('/profile')),
            'loginUrl'   => esc_url_raw(wp_login_url(home_url('/profile'))),
        );
    }

    public static function register_hooks()
    {
        add_filter('login_redirect', array(__CLASS__, 'login_redirect'), 10, 3);
        add_filter('rest_authentication_errors', array(__CLASS__, 'rest_authentication_errors'), 100);
    }

    /**
     * Evita 403 por nonce/cookie inválida en rutas Terranima (sesión rota o mezclada).
     *
     * @param WP_Error|true|null $result
     * @return WP_Error|true|null
     */
    public static function rest_authentication_errors($result)
    {
        if (empty($result) || !is_wp_error($result)) {
            return $result;
        }

        if ($result->get_error_code() !== 'rest_cookie_invalid_nonce') {
            return $result;
        }

        $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
        if ($uri === '') {
            return $result;
        }

        if (
            strpos($uri, '/terranima/v1/login') !== false
            || strpos($uri, '/terranima/v1/me') !== false
            || strpos($uri, '/terranima/v1/logout') !== false
        ) {
            // Anula el 403 de nonce caducado; permission_callback decide (401/ok).
            return null;
        }

        return $result;
    }

    /**
     * Tras login WP clásico, enviar usuarios Terranima a /profile.
     *
     * @param string           $redirect_to
     * @param string           $requested_redirect
     * @param WP_User|WP_Error $user
     * @return string
     */
    public static function login_redirect($redirect_to, $requested_redirect, $user)
    {
        if (is_wp_error($user) || !($user instanceof WP_User)) {
            return $redirect_to;
        }

        if (!self::user_can_access($user)) {
            return $redirect_to;
        }

        if ($requested_redirect !== '') {
            return $requested_redirect;
        }

        return home_url('/profile');
    }
}
