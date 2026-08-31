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
        $bytes = 0;
        $path = $attachment_id ? get_attached_file($attachment_id) : '';
        if ($path && is_readable($path)) {
            $bytes = (int) filesize($path);
        }
        $mime = $attachment_id ? (string) get_post_mime_type($attachment_id) : '';
        $tipo = 'PDF';
        if (strpos($mime, 'video/') === 0) {
            $tipo = 'Vídeo';
        } elseif (strpos($mime, 'image/') === 0) {
            $tipo = 'Imagen';
        }
        $url = rest_url(Terranima_REST::NAMESPACE . '/documentos/' . $post_id . '/file');

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

        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $is_prof = $tipo === Terranima_Roles::TIPO_PROFESIONAL;

        if ($is_prof) {
            $familia_id = isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : 0;
        } else {
            $familia_id = (int) $user->ID;
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

        $allowed = array('pdf', 'jpg', 'jpeg', 'png', 'mp4', 'webm', 'mov', 'm4v');
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            return new WP_Error('terranima_doc_type', __('Solo se permiten PDF, JPG, PNG y vídeo (MP4, WebM, MOV).', 'terranima-profile'), array('status' => 400));
        }

        $max = (int) wp_max_upload_size();
        if (!empty($file['size']) && $max > 0 && (int) $file['size'] > $max) {
            return new WP_Error(
                'terranima_doc_size',
                sprintf(
                    /* translators: %s: max upload size */
                    __('El archivo supera el tamaño máximo (%s).', 'terranima-profile'),
                    size_format($max)
                ),
                array('status' => 400)
            );
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        self::ensure_private_dir();
        add_filter('upload_dir', array(__CLASS__, 'filter_upload_dir'));
        add_filter('wp_check_filetype_and_ext', array(__CLASS__, 'filter_filetype'), 10, 4);

        $overrides = array(
            'test_form' => false,
            'mimes'     => self::allowed_mimes(),
        );

        $upload = wp_handle_upload($file, $overrides);
        remove_filter('upload_dir', array(__CLASS__, 'filter_upload_dir'));
        remove_filter('wp_check_filetype_and_ext', array(__CLASS__, 'filter_filetype'), 10);
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

    /**
     * @return array<string, string>
     */
    public static function allowed_mimes()
    {
        return array(
            'pdf'  => 'application/pdf',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'mp4'  => 'video/mp4',
            'm4v'  => 'video/x-m4v',
            'webm' => 'video/webm',
            'mov'  => 'video/quicktime',
        );
    }

    /**
     * Carpeta fuera del listado público de la biblioteca.
     *
     * @param array<string, string> $dirs
     * @return array<string, string>
     */
    public static function filter_upload_dir($dirs)
    {
        $extra = '/terranima-private' . (isset($dirs['subdir']) ? $dirs['subdir'] : '');
        $dirs['subdir'] = $extra;
        $dirs['path'] = $dirs['basedir'] . $extra;
        $dirs['url'] = $dirs['baseurl'] . $extra;
        return $dirs;
    }

    /**
     * Confía en la extensión de la lista permitida (WP a veces rechaza MOV/WebM).
     *
     * @param array<string, mixed>       $data
     * @param string                     $file
     * @param string                     $filename
     * @param array<string, string>|null $mimes
     * @return array<string, mixed>
     */
    public static function filter_filetype($data, $file, $filename, $mimes)
    {
        unset($file, $mimes);
        $ext = strtolower((string) pathinfo($filename, PATHINFO_EXTENSION));
        $allowed = self::allowed_mimes();
        if (isset($allowed[$ext])) {
            $data['ext'] = $ext;
            $data['type'] = $allowed[$ext];
            $data['proper_filename'] = $filename;
        }
        return $data;
    }

    public static function ensure_private_dir()
    {
        $uploads = wp_upload_dir();
        if (!empty($uploads['error'])) {
            return;
        }

        $dir = trailingslashit($uploads['basedir']) . 'terranima-private';
        wp_mkdir_p($dir);

        $htaccess = $dir . '/.htaccess';
        if (!file_exists($htaccess)) {
            $rules = implode(
                "\n",
                array(
                    '# Terranima: no servir documentos por URL directa.',
                    '<IfModule mod_authz_core.c>',
                    'Require all denied',
                    '</IfModule>',
                    '<IfModule !mod_authz_core.c>',
                    'Deny from all',
                    '</IfModule>',
                    '',
                )
            );
            file_put_contents($htaccess, $rules);
        }

        $index = $dir . '/index.php';
        if (!file_exists($index)) {
            file_put_contents($index, "<?php\n// Silence is golden.\n");
        }
    }

    /**
     * Descarga autenticada (cookie del portal). Soporta Range para vídeo.
     *
     * @param int $post_id
     * @return WP_Error|void
     */
    public static function stream_file($post_id)
    {
        $post_id = (int) $post_id;
        if (!self::current_user_can_view($post_id)) {
            return new WP_Error('terranima_forbidden', __('No puedes ver este documento.', 'terranima-profile'), array('status' => 403));
        }

        $attachment_id = (int) get_post_meta($post_id, self::META_ATTACHMENT, true);
        $path = $attachment_id ? get_attached_file($attachment_id) : '';
        if (!$path || !is_readable($path)) {
            return new WP_Error('terranima_doc_missing', __('Archivo no encontrado.', 'terranima-profile'), array('status' => 404));
        }

        $mime = (string) get_post_mime_type($attachment_id);
        if ($mime === '') {
            $mime = 'application/octet-stream';
        }
        $name = sanitize_file_name(basename($path));
        $size = (int) filesize($path);
        $start = 0;
        $end = max(0, $size - 1);

        if (!empty($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', (string) wp_unslash($_SERVER['HTTP_RANGE']), $m)) {
            if ($m[1] !== '') {
                $start = (int) $m[1];
            }
            if ($m[2] !== '') {
                $end = (int) $m[2];
            }
            if ($start > $end || $start >= $size) {
                status_header(416);
                header('Content-Range: bytes */' . $size);
                exit;
            }
            status_header(206);
            header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
        } else {
            status_header(200);
        }

        nocache_headers();
        header('Content-Type: ' . $mime);
        header('X-Content-Type-Options: nosniff');
        header('Accept-Ranges: bytes');
        header('Content-Length: ' . ($end - $start + 1));
        header('Content-Disposition: inline; filename="' . $name . '"');

        while (ob_get_level()) {
            ob_end_clean();
        }

        $fp = fopen($path, 'rb');
        if (!$fp) {
            return new WP_Error('terranima_doc_missing', __('Archivo no encontrado.', 'terranima-profile'), array('status' => 404));
        }

        fseek($fp, $start);
        $left = $end - $start + 1;
        while ($left > 0 && !feof($fp)) {
            $chunk = fread($fp, min(8192, $left));
            if ($chunk === false) {
                break;
            }
            echo $chunk;
            $left -= strlen($chunk);
            flush();
        }
        fclose($fp);
        exit;
    }
}
