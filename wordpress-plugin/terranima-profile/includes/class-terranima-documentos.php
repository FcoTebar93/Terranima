<?php
/**
 * Documentos (CPT + adjuntos en la biblioteca de medios).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Documentos
{
    public const META_ATTACHMENT = 'attachment_id';
    public const META_FAMILIA = 'familia_user_id';
    public const META_ANIMAL = 'animal_nombre';
    public const META_CATEGORIA = 'categoria';
    public const META_SUBIDO_POR = 'subido_por'; // cliente|profesional
    public const META_ROL = 'rol_profesional';

    public const CATEGORIAS = array('analisis', 'vacunacion', 'radiografia', 'informe', 'receta', 'otro');

    /**
     * @param int $post_id
     * @return array<string, mixed>|null
     */
    public static function serialize($post_id)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::DOCUMENTO) {
            return null;
        }

        $attachment_id = (int) get_post_meta($post_id, self::META_ATTACHMENT, true);
        $bytes = $attachment_id ? (int) filesize(get_attached_file($attachment_id)) : 0;
        $mime = $attachment_id ? (string) get_post_mime_type($attachment_id) : '';
        $tipo = (strpos($mime, 'image/') === 0) ? 'Imagen' : 'PDF';
        $url = $attachment_id ? (string) wp_get_attachment_url($attachment_id) : '';

        $subido = (string) get_post_meta($post_id, self::META_SUBIDO_POR, true);
        if ($subido !== 'profesional') {
            $subido = 'cliente';
        }

        $familia_id = (int) get_post_meta($post_id, self::META_FAMILIA, true);
        $familia_user = $familia_id ? get_user_by('id', $familia_id) : null;
        $familia_nombre = '';
        if ($familia_user) {
            $familia_nombre = (string) get_user_meta($familia_id, Terranima_Roles::META_NOMBRE_FAMILIA, true);
            if ($familia_nombre === '') {
                $familia_nombre = Terranima_Auth::get_display_name($familia_user);
            }
        }

        return array(
            'id'             => (string) $post_id,
            'nombre'         => $post->post_title,
            'tipo'           => $tipo,
            'animal'         => (string) get_post_meta($post_id, self::META_ANIMAL, true),
            'fecha'          => get_the_date('Y-m-d', $post),
            'tamano'         => self::format_size($bytes),
            'categoria'      => (string) get_post_meta($post_id, self::META_CATEGORIA, true) ?: 'otro',
            'subidoPor'      => $subido,
            'rolProfesional' => $subido === 'profesional'
                ? ((string) get_post_meta($post_id, self::META_ROL, true) ?: null)
                : null,
            'url'            => $url,
            'familiaUserId'  => $familia_id,
            'familiaNombre'  => $familia_nombre,
            'puedeBorrar'    => self::current_user_can_delete($post_id),
        );
    }

    /**
     * @param int $bytes
     * @return string
     */
    private static function format_size($bytes)
    {
        if ($bytes <= 0) {
            return '0 MB';
        }
        return number_format($bytes / 1024 / 1024, 1) . ' MB';
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
                'key'   => self::META_FAMILIA,
                'value' => (int) $args['familia_user_id'],
                'type'  => 'NUMERIC',
            );
        }

        $q = new WP_Query(
            array(
                'post_type'      => Terranima_CPTs::DOCUMENTO,
                'post_status'    => 'publish',
                'posts_per_page' => 100,
                'orderby'        => 'date',
                'order'          => 'DESC',
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
     * @param array<string, mixed> $file $_FILES item
     * @param array<string, mixed> $data
     * @return int|WP_Error
     */
    public static function create_from_upload($file, $data = array())
    {
        if (empty($file) || !is_array($file) || empty($file['tmp_name'])) {
            return new WP_Error('terranima_doc_missing', __('No se recibió ningún archivo.', 'terranima-profile'), array('status' => 400));
        }

        $allowed = array('pdf', 'jpg', 'jpeg', 'png');
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            return new WP_Error('terranima_doc_type', __('Solo se permiten PDF, JPG y PNG.', 'terranima-profile'), array('status' => 400));
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $overrides = array(
            'test_form' => false,
            'mimes'     => array(
                'pdf'  => 'application/pdf',
                'jpg'  => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png'  => 'image/png',
            ),
        );

        $upload = wp_handle_upload($file, $overrides);
        if (isset($upload['error'])) {
            return new WP_Error('terranima_doc_upload', $upload['error'], array('status' => 400));
        }

        $attachment = array(
            'post_mime_type' => $upload['type'],
            'post_title'     => sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME)),
            'post_content'   => '',
            'post_status'    => 'inherit',
        );

        $attachment_id = wp_insert_attachment($attachment, $upload['file']);
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        $meta = wp_generate_attachment_metadata($attachment_id, $upload['file']);
        wp_update_attachment_metadata($attachment_id, $meta);

        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $is_prof = $tipo === Terranima_Roles::TIPO_PROFESIONAL;

        $familia_id = isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : 0;
        if (!$familia_id) {
            $familia_id = $is_prof ? 0 : (int) $user->ID;
        }
        if (!$familia_id) {
            return new WP_Error('terranima_doc_familia', __('Indica la familia del documento.', 'terranima-profile'), array('status' => 400));
        }

        if ($is_prof && !self::profesional_can_access_familia($familia_id, $user)) {
            return new WP_Error(
                'terranima_doc_not_assigned',
                __('Solo puedes subir archivos a familias asignadas a ti.', 'terranima-profile'),
                array('status' => 403)
            );
        }

        $categoria = isset($data['categoria']) ? sanitize_key($data['categoria']) : 'otro';
        if (!in_array($categoria, self::CATEGORIAS, true)) {
            $categoria = 'otro';
        }

        $animal = isset($data['animal']) ? sanitize_text_field($data['animal']) : '';
        $rol = '';
        if ($is_prof) {
            $slug = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            $rol = Terranima_Auth::especialidad_label($slug) ?: 'Equipo';
        }

        $post_id = wp_insert_post(
            array(
                'post_type'   => Terranima_CPTs::DOCUMENTO,
                'post_status' => 'publish',
                'post_title'  => sanitize_file_name($file['name']),
                'post_author' => (int) $user->ID,
            ),
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        update_post_meta($post_id, self::META_ATTACHMENT, $attachment_id);
        update_post_meta($post_id, self::META_FAMILIA, $familia_id);
        update_post_meta($post_id, self::META_ANIMAL, $animal);
        update_post_meta($post_id, self::META_CATEGORIA, $categoria);
        update_post_meta($post_id, self::META_SUBIDO_POR, $is_prof ? 'profesional' : 'cliente');
        if ($rol !== '') {
            update_post_meta($post_id, self::META_ROL, $rol);
        }

        return (int) $post_id;
    }

    /**
     * Familias a las que el profesional puede subir / ver documentos
     * (mismas que en chats: roles familia activos).
     *
     * @param WP_User|null $user
     * @return array<int, int>
     */
    public static function assigned_familia_ids($user = null)
    {
        $user = $user instanceof WP_User ? $user : wp_get_current_user();
        if (Terranima_Auth::get_tipo($user) !== Terranima_Roles::TIPO_PROFESIONAL) {
            return array();
        }

        $ids = array();
        foreach (Terranima_Chat::list_familias() as $familia) {
            if (!empty($familia['id'])) {
                $ids[] = (int) $familia['id'];
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * @param int          $familia_id
     * @param WP_User|null $user
     * @return bool
     */
    public static function profesional_can_access_familia($familia_id, $user = null)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return false;
        }
        return in_array($familia_id, self::assigned_familia_ids($user), true);
    }

    /**
     * @param int $post_id
     * @return bool
     */
    public static function current_user_can_delete($post_id)
    {
        $user_id = get_current_user_id();
        if (!$user_id) {
            return false;
        }
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::DOCUMENTO) {
            return false;
        }
        // Cada quien borra solo lo que ha subido (familia o profesional).
        return (int) $post->post_author === $user_id;
    }

    /**
     * @param int $post_id
     * @return true|WP_Error
     */
    public static function delete($post_id)
    {
        if (!self::current_user_can_delete($post_id)) {
            return new WP_Error('terranima_forbidden', __('No puedes eliminar este documento.', 'terranima-profile'), array('status' => 403));
        }

        $attachment_id = (int) get_post_meta($post_id, self::META_ATTACHMENT, true);
        wp_delete_post($post_id, true);
        if ($attachment_id) {
            wp_delete_attachment($attachment_id, true);
        }
        return true;
    }

    /**
     * ¿Puede el usuario ver el documento?
     *
     * @param int $post_id
     * @return bool
     */
    public static function current_user_can_view($post_id)
    {
        $user = wp_get_current_user();
        if (!Terranima_Auth::user_can_access($user)) {
            return false;
        }
        $familia = (int) get_post_meta($post_id, self::META_FAMILIA, true);
        $tipo = Terranima_Auth::get_tipo($user);
        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            return self::profesional_can_access_familia($familia, $user);
        }
        return $familia === (int) $user->ID;
    }
}
