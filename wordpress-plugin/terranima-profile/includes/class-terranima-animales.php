<?php
/**
 * Fichas de animales (CPT terranima_animal).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Animales
{
    public const META_FAMILIA = 'familia_user_id';
    public const META_ESPECIE = 'especie';
    public const META_RAZA = 'raza';
    public const META_SEXO = 'sexo';
    public const META_NACIMIENTO = 'fecha_nacimiento';
    public const META_COLOR = 'color';
    public const META_PESO = 'peso';
    public const META_MICROCHIP = 'microchip';
    public const META_NOTAS_PROF = 'notas_profesional';
    public const META_NOTAS_TUTOR = 'notas_tutor';

    /**
     * @param int $post_id
     * @return array<string, mixed>|null
     */
    public static function serialize($post_id)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::ANIMAL) {
            return null;
        }

        $nacimiento = (string) get_post_meta($post_id, self::META_NACIMIENTO, true);
        $sexo = (string) get_post_meta($post_id, self::META_SEXO, true);
        if ($sexo !== 'macho') {
            $sexo = 'hembra';
        }

        $thumb = get_the_post_thumbnail_url($post_id, 'medium');

        return array(
            'id'               => (string) $post_id,
            'nombre'           => $post->post_title,
            'especie'          => (string) get_post_meta($post_id, self::META_ESPECIE, true),
            'raza'             => (string) get_post_meta($post_id, self::META_RAZA, true),
            'sexo'             => $sexo,
            'edad'             => self::edad($nacimiento),
            'fechaNacimiento'  => $nacimiento,
            'color'            => (string) get_post_meta($post_id, self::META_COLOR, true),
            'peso'             => (string) get_post_meta($post_id, self::META_PESO, true),
            'microchip'        => (string) get_post_meta($post_id, self::META_MICROCHIP, true),
            'notasProfesional' => (string) get_post_meta($post_id, self::META_NOTAS_PROF, true),
            'notasTutor'       => (string) get_post_meta($post_id, self::META_NOTAS_TUTOR, true),
            'foto'             => $thumb ? $thumb : null,
            'familiaUserId'    => (int) get_post_meta($post_id, self::META_FAMILIA, true),
        );
    }

    /**
     * @param string $fecha Y-m-d
     * @return int
     */
    private static function edad($fecha)
    {
        if ($fecha === '') {
            return 0;
        }
        try {
            $born = new DateTime($fecha);
            $now = new DateTime('now');
            return max(0, (int) $born->diff($now)->y);
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * @param int $familia_id
     * @return array<int, array<string, mixed>>
     */
    public static function query_for_familia($familia_id)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return array();
        }

        $q = new WP_Query(
            array(
                'post_type'      => Terranima_CPTs::ANIMAL,
                'post_status'    => 'publish',
                'posts_per_page' => 50,
                'orderby'        => 'title',
                'order'          => 'ASC',
                'meta_query'     => array(
                    array(
                        'key'   => self::META_FAMILIA,
                        'value' => $familia_id,
                        'type'  => 'NUMERIC',
                    ),
                ),
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
     * @return int|WP_Error
     */
    public static function create($data)
    {
        $user = wp_get_current_user();
        if (Terranima_Auth::get_tipo($user) !== Terranima_Roles::TIPO_PROFESIONAL) {
            return new WP_Error('terranima_forbidden', __('Solo el equipo puede crear fichas de animales.', 'terranima-profile'), array('status' => 403));
        }

        $familia_id = isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : 0;
        if ($familia_id <= 0) {
            return new WP_Error('terranima_animal_familia', __('Indica la familia.', 'terranima-profile'), array('status' => 400));
        }
        if (!Terranima_Documentos::profesional_can_access_familia($familia_id, $user)) {
            return new WP_Error('terranima_forbidden', __('No tienes acceso a esa familia.', 'terranima-profile'), array('status' => 403));
        }

        $nombre = isset($data['nombre']) ? sanitize_text_field($data['nombre']) : '';
        if ($nombre === '') {
            return new WP_Error('terranima_animal_nombre', __('El nombre del animal es obligatorio.', 'terranima-profile'), array('status' => 400));
        }

        $post_id = wp_insert_post(
            array(
                'post_type'   => Terranima_CPTs::ANIMAL,
                'post_status' => 'publish',
                'post_title'  => $nombre,
                'post_author' => (int) $user->ID,
            ),
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        update_post_meta($post_id, self::META_FAMILIA, $familia_id);
        self::write_fields($post_id, $data, false);

        return (int) $post_id;
    }

    /**
     * @param int                  $post_id
     * @param array<string, mixed> $data
     * @return true|WP_Error
     */
    public static function update($post_id, $data)
    {
        $post_id = (int) $post_id;
        $check = self::assert_profesional_can_manage($post_id);
        if (is_wp_error($check)) {
            return $check;
        }

        if (isset($data['nombre']) && sanitize_text_field($data['nombre']) !== '') {
            wp_update_post(
                array(
                    'ID'         => $post_id,
                    'post_title' => sanitize_text_field($data['nombre']),
                )
            );
        }

        self::write_fields($post_id, $data, true);

        return true;
    }

    /**
     * El profesional no puede cambiar las notas del tutor.
     *
     * @param int                  $post_id
     * @param array<string, mixed> $data
     * @param bool                 $is_update
     */
    private static function write_fields($post_id, $data, $is_update)
    {
        $map = array(
            'especie'          => self::META_ESPECIE,
            'raza'             => self::META_RAZA,
            'sexo'             => self::META_SEXO,
            'fechaNacimiento'  => self::META_NACIMIENTO,
            'fecha_nacimiento' => self::META_NACIMIENTO,
            'color'            => self::META_COLOR,
            'peso'             => self::META_PESO,
            'microchip'        => self::META_MICROCHIP,
            'notasProfesional' => self::META_NOTAS_PROF,
            'notas_profesional'=> self::META_NOTAS_PROF,
        );

        foreach ($map as $key => $meta) {
            if (!array_key_exists($key, $data)) {
                continue;
            }
            $value = sanitize_textarea_field((string) $data[$key]);
            if ($meta === self::META_SEXO) {
                $value = ($value === 'macho') ? 'macho' : 'hembra';
            }
            if ($meta === self::META_ESPECIE) {
                $value = sanitize_text_field((string) $data[$key]);
            }
            update_post_meta($post_id, $meta, $value);
        }

        unset($is_update);
    }

    /**
     * @param int $post_id
     * @return true|WP_Error
     */
    public static function delete($post_id)
    {
        $post_id = (int) $post_id;
        $check = self::assert_profesional_can_manage($post_id);
        if (is_wp_error($check)) {
            return $check;
        }

        $thumb = get_post_thumbnail_id($post_id);
        wp_delete_post($post_id, true);
        if ($thumb) {
            wp_delete_attachment((int) $thumb, true);
        }

        return true;
    }

    /**
     * @param int                  $post_id
     * @param array<string, mixed> $file $_FILES item
     * @return true|WP_Error
     */
    public static function set_foto($post_id, $file)
    {
        $post_id = (int) $post_id;
        $check = self::assert_profesional_can_manage($post_id);
        if (is_wp_error($check)) {
            return $check;
        }

        if (empty($file) || !is_array($file) || empty($file['tmp_name'])) {
            return new WP_Error('terranima_animal_foto', __('No se recibió ninguna imagen.', 'terranima-profile'), array('status' => 400));
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, array('jpg', 'jpeg', 'png', 'webp'), true)) {
            return new WP_Error('terranima_animal_foto_tipo', __('Solo se permiten JPG, PNG o WebP.', 'terranima-profile'), array('status' => 400));
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $upload = wp_handle_upload(
            $file,
            array(
                'test_form' => false,
                'mimes'     => array(
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'webp' => 'image/webp',
                ),
            )
        );
        if (isset($upload['error'])) {
            return new WP_Error('terranima_animal_foto', $upload['error'], array('status' => 400));
        }

        $attachment_id = wp_insert_attachment(
            array(
                'post_mime_type' => $upload['type'],
                'post_title'     => sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME)),
                'post_content'   => '',
                'post_status'    => 'inherit',
            ),
            $upload['file'],
            $post_id
        );
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        $meta = wp_generate_attachment_metadata($attachment_id, $upload['file']);
        wp_update_attachment_metadata($attachment_id, $meta);

        $old = get_post_thumbnail_id($post_id);
        set_post_thumbnail($post_id, $attachment_id);
        if ($old && (int) $old !== (int) $attachment_id) {
            wp_delete_attachment((int) $old, true);
        }

        return true;
    }

    /**
     * @param int $post_id
     * @return true|WP_Error
     */
    public static function assert_profesional_can_manage($post_id)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::ANIMAL) {
            return new WP_Error('terranima_not_found', __('Animal no encontrado.', 'terranima-profile'), array('status' => 404));
        }

        $user = wp_get_current_user();
        if (Terranima_Auth::get_tipo($user) !== Terranima_Roles::TIPO_PROFESIONAL) {
            return new WP_Error('terranima_forbidden', __('Solo el equipo puede gestionar fichas de animales.', 'terranima-profile'), array('status' => 403));
        }

        $familia_id = (int) get_post_meta($post_id, self::META_FAMILIA, true);
        if (!Terranima_Documentos::profesional_can_access_familia($familia_id, $user)) {
            return new WP_Error('terranima_forbidden', __('No tienes acceso a esa familia.', 'terranima-profile'), array('status' => 403));
        }

        return true;
    }
}
