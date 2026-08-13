<?php
/**
 * Servicio de citas (CPT terranima_cita).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Citas
{
    public const META_FECHA = 'fecha';
    public const META_HORA = 'hora';
    public const META_ESTADO = 'estado';
    public const META_ESPECIALIDAD = 'especialidad';
    public const META_TIPO = 'tipo_cita';
    public const META_FAMILIA_USER = 'familia_user_id';
    public const META_PROFESIONAL_USER = 'profesional_user_id';
    public const META_ANIMAL_NOMBRE = 'animal_nombre';
    public const META_SOLO_PROFESIONAL = 'solo_profesional';

    public const ESTADOS = array('pendiente', 'confirmada', 'rechazada', 'cancelada', 'completada');

    /**
     * @param string $label_or_slug
     * @return string slug
     */
    public static function especialidad_slug($label_or_slug)
    {
        $label_or_slug = trim((string) $label_or_slug);
        $map = Terranima_Roles::especialidades();
        if (isset($map[$label_or_slug])) {
            return $label_or_slug;
        }
        foreach ($map as $slug => $label) {
            if (strcasecmp($label, $label_or_slug) === 0) {
                return $slug;
            }
        }
        return sanitize_title($label_or_slug);
    }

    /**
     * @param string $slug
     * @return string
     */
    public static function especialidad_label($slug)
    {
        $map = Terranima_Roles::especialidades();
        return isset($map[$slug]) ? $map[$slug] : $slug;
    }

    /**
     * @param int $post_id
     * @return array<string, mixed>|null
     */
    public static function serialize($post_id)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::CITA) {
            return null;
        }

        $familia_id = (int) get_post_meta($post_id, self::META_FAMILIA_USER, true);
        $familia_user = $familia_id ? get_user_by('id', $familia_id) : null;
        $especialidad = (string) get_post_meta($post_id, self::META_ESPECIALIDAD, true);
        $tipo = (string) get_post_meta($post_id, self::META_TIPO, true);
        if ($tipo === '') {
            $tipo = self::especialidad_label($especialidad);
        }

        $familia_nombre = $familia_user
            ? (string) get_user_meta($familia_id, Terranima_Roles::META_NOMBRE_FAMILIA, true)
            : '';
        if ($familia_nombre === '' && $familia_user) {
            $familia_nombre = Terranima_Auth::get_display_name($familia_user);
        }

        return array(
            'id'              => (string) $post_id,
            'fecha'           => (string) get_post_meta($post_id, self::META_FECHA, true),
            'hora'            => (string) get_post_meta($post_id, self::META_HORA, true),
            'tipo'            => $tipo,
            'profesional'     => self::especialidad_label($especialidad),
            'especialidad'    => $especialidad,
            'animal'          => (string) get_post_meta($post_id, self::META_ANIMAL_NOMBRE, true),
            'familia'         => $familia_nombre,
            'tutor'           => $familia_user ? Terranima_Auth::get_display_name($familia_user) : '',
            'familiaUserId'   => $familia_id,
            'estado'          => (string) get_post_meta($post_id, self::META_ESTADO, true),
            'notas'           => $post->post_content !== '' ? $post->post_content : null,
            'soloProfesional' => (bool) get_post_meta($post_id, self::META_SOLO_PROFESIONAL, true),
            'direccion'       => $familia_id
                ? (string) get_user_meta($familia_id, Terranima_Roles::META_DIRECCION, true)
                : '',
        );
    }

    /**
     * @param array<string, mixed> $args
     * @return array<int, array<string, mixed>>
     */
    public static function query($args = array())
    {
        $meta_query = array('relation' => 'AND');

        if (!empty($args['familia_user_id'])) {
            $meta_query[] = array(
                'key'   => self::META_FAMILIA_USER,
                'value' => (int) $args['familia_user_id'],
                'type'  => 'NUMERIC',
            );
        }

        if (!empty($args['especialidad'])) {
            $meta_query[] = array(
                'key'   => self::META_ESPECIALIDAD,
                'value' => self::especialidad_slug($args['especialidad']),
            );
        }

        if (!empty($args['estado'])) {
            $estados = is_array($args['estado']) ? $args['estado'] : array($args['estado']);
            $meta_query[] = array(
                'key'     => self::META_ESTADO,
                'value'   => $estados,
                'compare' => 'IN',
            );
        }

        $q = new WP_Query(
            array(
                'post_type'      => Terranima_CPTs::CITA,
                'post_status'    => 'publish',
                'posts_per_page' => isset($args['limit']) ? (int) $args['limit'] : 100,
                'orderby'        => 'meta_value',
                'meta_key'       => self::META_FECHA,
                'order'          => 'ASC',
                'meta_query'     => count($meta_query) > 1 ? $meta_query : array(),
                'no_found_rows'  => true,
            )
        );

        $out = array();
        foreach ($q->posts as $post) {
            $item = self::serialize($post->ID);
            if ($item) {
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $data
     * @return int|WP_Error post ID
     */
    public static function create($data)
    {
        $fecha = isset($data['fecha']) ? sanitize_text_field($data['fecha']) : '';
        $hora = isset($data['hora']) ? sanitize_text_field($data['hora']) : '';
        $especialidad = self::especialidad_slug(isset($data['especialidad']) ? $data['especialidad'] : (isset($data['tipo']) ? $data['tipo'] : ''));
        $tipo = isset($data['tipo']) ? sanitize_text_field($data['tipo']) : self::especialidad_label($especialidad);
        $animal = isset($data['animal']) ? sanitize_text_field($data['animal']) : '';
        $notas = isset($data['notas']) ? sanitize_textarea_field($data['notas']) : '';
        $familia_id = isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : get_current_user_id();
        $estado = isset($data['estado']) ? sanitize_text_field($data['estado']) : 'pendiente';
        $solo = !empty($data['soloProfesional']) || !empty($data['solo_profesional']);

        if ($fecha === '' || $hora === '' || $especialidad === '') {
            return new WP_Error('terranima_cita_invalid', __('Faltan fecha, hora o especialidad.', 'terranima-profile'), array('status' => 400));
        }

        if (!in_array($estado, self::ESTADOS, true)) {
            $estado = 'pendiente';
        }

        $title = sprintf('%s · %s %s', $tipo, $fecha, $hora);

        $post_id = wp_insert_post(
            array(
                'post_type'    => Terranima_CPTs::CITA,
                'post_status'  => 'publish',
                'post_title'   => $title,
                'post_content' => $notas,
                'post_author'  => get_current_user_id(),
            ),
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        update_post_meta($post_id, self::META_FECHA, $fecha);
        update_post_meta($post_id, self::META_HORA, $hora);
        update_post_meta($post_id, self::META_ESTADO, $estado);
        update_post_meta($post_id, self::META_ESPECIALIDAD, $especialidad);
        update_post_meta($post_id, self::META_TIPO, $tipo);
        update_post_meta($post_id, self::META_FAMILIA_USER, $familia_id);
        update_post_meta($post_id, self::META_ANIMAL_NOMBRE, $animal);
        update_post_meta($post_id, self::META_SOLO_PROFESIONAL, $solo ? 1 : 0);
        update_post_meta($post_id, 'creado_por', get_current_user_id());

        $prof_id = self::find_profesional_for_especialidad($especialidad);
        if ($prof_id) {
            update_post_meta($post_id, self::META_PROFESIONAL_USER, $prof_id);
        }

        return (int) $post_id;
    }

    /**
     * @param int    $post_id
     * @param string $estado
     * @return true|WP_Error
     */
    public static function set_estado($post_id, $estado)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::CITA) {
            return new WP_Error('terranima_cita_not_found', __('Cita no encontrada.', 'terranima-profile'), array('status' => 404));
        }

        $estado = sanitize_text_field($estado);
        if (!in_array($estado, self::ESTADOS, true)) {
            return new WP_Error('terranima_cita_bad_estado', __('Estado no válido.', 'terranima-profile'), array('status' => 400));
        }

        update_post_meta($post_id, self::META_ESTADO, $estado);
        return true;
    }

    /**
     * @param string $especialidad_slug
     * @return int user ID or 0
     */
    public static function find_profesional_for_especialidad($especialidad_slug)
    {
        $users = get_users(
            array(
                'role'       => Terranima_Roles::ROLE_PROFESIONAL,
                'number'     => 1,
                'meta_key'   => Terranima_Roles::META_ESPECIALIDAD,
                'meta_value' => $especialidad_slug,
                'fields'     => 'ID',
            )
        );

        if (empty($users)) {
            return 0;
        }

        return (int) $users[0];
    }

    /**
     * ¿Puede el usuario actual gestionar esta cita?
     *
     * @param int $post_id
     * @return bool
     */
    public static function current_user_can_manage($post_id)
    {
        $user = wp_get_current_user();
        if (!$user->exists() || !Terranima_Auth::user_can_access($user)) {
            return false;
        }

        $tipo = Terranima_Auth::get_tipo($user);
        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            $cita_esp = (string) get_post_meta($post_id, self::META_ESPECIALIDAD, true);
            return $esp !== '' && $esp === $cita_esp;
        }

        $familia_id = (int) get_post_meta($post_id, self::META_FAMILIA_USER, true);
        return $familia_id === (int) $user->ID;
    }
}
