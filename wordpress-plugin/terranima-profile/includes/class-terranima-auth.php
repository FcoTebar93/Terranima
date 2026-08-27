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

        if (!Terranima_Roles::user_has_terranima_role($user)) {
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

        if (Terranima_Roles::user_is_profesional($user)) {
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
            'nonce'       => wp_create_nonce('wp_rest'),
        );
    }

    /**
     * Login del portal: mismas credenciales WP, sesión distinta a wp-login / wp-admin.
     *
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

        $checked = wp_authenticate($user->user_login, $password);
        if (is_wp_error($checked) || !($checked instanceof WP_User)) {
            return new WP_Error('terranima_invalid_credentials', __('No hemos podido reconocer esas credenciales.', 'terranima-profile'), array('status' => 401));
        }

        if (!self::user_can_access($checked)) {
            return new WP_Error('terranima_forbidden', __('Tu cuenta no tiene acceso al área Terranima.', 'terranima-profile'), array('status' => 403));
        }

        self::set_portal_session($checked);

        return $checked;
    }

    /**
     * Cierra solo el portal. No cierra la sesión de wp-admin.
     */
    public static function logout()
    {
        self::clear_portal_session();
    }

    /**
     * Usuario de la sesión del portal (cookie propia), no el de wp-login.
     *
     * @return WP_User|null
     */
    public static function portal_user()
    {
        $cookie = self::portal_cookie_value();
        if ($cookie === '') {
            return null;
        }

        $parts = explode('|', $cookie);
        if (count($parts) !== 3) {
            return null;
        }

        $user_id = (int) $parts[0];
        $expires = (int) $parts[1];
        $hmac = (string) $parts[2];

        if ($user_id <= 0 || $expires < time()) {
            return null;
        }

        $expected = self::portal_signature($user_id, $expires);
        if ($expected === '' || !hash_equals($expected, $hmac)) {
            return null;
        }

        $user = get_user_by('id', $user_id);
        if (!$user instanceof WP_User || !$user->exists()) {
            return null;
        }

        return $user;
    }

    /**
     * Fija el usuario actual de la petición al del portal, si la cookie es válida.
     *
     * @return WP_User|null
     */
    public static function adopt_portal_user()
    {
        $user = self::portal_user();
        if (!$user) {
            return null;
        }

        wp_set_current_user($user->ID);

        return $user;
    }

    /**
     * Config inyectada en la SPA.
     *
     * @return array<string, string>
     */
    public static function frontend_config()
    {
        return array(
            'restUrl'          => esc_url_raw(rest_url('terranima/v1')),
            'nonce'            => wp_create_nonce('wp_rest'),
            'profileUrl'       => esc_url_raw(home_url('/profile')),
            'loginUrl'         => esc_url_raw(home_url('/profile')),
            'lostPasswordUrl'  => esc_url_raw(wp_lostpassword_url(home_url('/profile'))),
            'wpAdminLoginUrl'  => esc_url_raw(wp_login_url()),
        );
    }

    public static function register_hooks()
    {
        add_filter('rest_authentication_errors', array(__CLASS__, 'rest_authentication_errors'), 100);
        add_action('admin_init', array(__CLASS__, 'block_wp_admin_for_portal_users'));
        add_filter('show_admin_bar', array(__CLASS__, 'maybe_hide_admin_bar'));
    }

    /**
     * Evita 403 por nonce/cookie inválida en la API Terranima (sesión rota o mezclada).
     * El permission_callback de cada ruta sigue exigiendo login donde corresponde.
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

        if (!self::is_terranima_rest_request()) {
            return $result;
        }

        return null;
    }

    /**
     * @return bool
     */
    public static function is_terranima_rest_request()
    {
        $uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '';
        if ($uri !== '' && strpos($uri, '/terranima/v1') !== false) {
            return true;
        }

        $route = '';
        if (isset($GLOBALS['wp']) && is_object($GLOBALS['wp']) && !empty($GLOBALS['wp']->query_vars['rest_route'])) {
            $route = (string) $GLOBALS['wp']->query_vars['rest_route'];
        } elseif (!empty($_GET['rest_route'])) {
            $route = (string) wp_unslash($_GET['rest_route']);
        }

        return $route !== '' && strpos($route, '/terranima/v1') !== false;
    }

    /**
     * Familias y profesionales usan /profile. wp-admin queda para roles de edición de la web.
     */
    public static function block_wp_admin_for_portal_users()
    {
        if (!is_user_logged_in() || wp_doing_ajax()) {
            return;
        }

        if (defined('REST_REQUEST') && REST_REQUEST) {
            return;
        }

        if (defined('WP_CLI') && WP_CLI) {
            return;
        }

        $user = wp_get_current_user();
        if (self::has_wordpress_staff_role($user)) {
            return;
        }

        if (!self::user_can_access($user)) {
            return;
        }

        wp_safe_redirect(home_url('/'));
        exit;
    }

    /**
     * @param bool $show
     * @return bool
     */
    public static function maybe_hide_admin_bar($show)
    {
        if (!is_user_logged_in()) {
            return $show;
        }

        $user = wp_get_current_user();
        if (self::has_wordpress_staff_role($user)) {
            return $show;
        }

        if (self::user_can_access($user)) {
            return false;
        }

        return $show;
    }

    /**
     * Roles de contenido/gestión de WP que no deben perder el acceso a wp-admin.
     *
     * @param WP_User $user
     * @return bool
     */
    public static function has_wordpress_staff_role($user)
    {
        $staff = array('administrator', 'editor', 'author', 'contributor', 'shop_manager');
        return (bool) array_intersect($staff, (array) $user->roles);
    }

    /**
     * @param WP_User $user
     */
    public static function set_portal_session(WP_User $user)
    {
        $expires = time() + (14 * DAY_IN_SECONDS);
        $value = $user->ID . '|' . $expires . '|' . self::portal_signature((int) $user->ID, $expires);
        self::write_portal_cookie($value, $expires);
    }

    public static function clear_portal_session()
    {
        self::write_portal_cookie('', time() - YEAR_IN_SECONDS);
        unset($_COOKIE[self::portal_cookie_name()]);
    }

    /**
     * @return string
     */
    private static function portal_cookie_name()
    {
        $hash = defined('COOKIEHASH') ? COOKIEHASH : '';
        return $hash !== '' ? 'terranima_portal_' . $hash : 'terranima_portal';
    }

    /**
     * @return string
     */
    private static function portal_cookie_value()
    {
        $name = self::portal_cookie_name();
        if (empty($_COOKIE[$name]) || !is_string($_COOKIE[$name])) {
            return '';
        }

        return sanitize_text_field(wp_unslash($_COOKIE[$name]));
    }

    /**
     * @param int $user_id
     * @param int $expires
     * @return string
     */
    private static function portal_signature($user_id, $expires)
    {
        return hash_hmac('sha256', (int) $user_id . '|' . (int) $expires, wp_salt('auth'));
    }

    /**
     * @param string $value
     * @param int    $expires
     */
    private static function write_portal_cookie($value, $expires)
    {
        $name = self::portal_cookie_name();
        $path = defined('COOKIEPATH') && COOKIEPATH ? COOKIEPATH : '/';
        $domain = defined('COOKIE_DOMAIN') && COOKIE_DOMAIN ? COOKIE_DOMAIN : '';
        $options = array(
            'expires'  => (int) $expires,
            'path'     => $path,
            'domain'   => $domain,
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        );

        setcookie($name, $value, $options);

        $site_path = defined('SITECOOKIEPATH') ? SITECOOKIEPATH : '';
        if ($site_path !== '' && $site_path !== $path) {
            $options['path'] = $site_path;
            setcookie($name, $value, $options);
        }

        if ($value !== '') {
            $_COOKIE[$name] = $value;
        }
    }
}
