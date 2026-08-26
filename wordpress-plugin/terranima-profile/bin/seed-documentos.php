<?php
/**
 * Documentos demo (familia sube / profesional sube) para pruebas locales.
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-documentos.php
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$maria = get_user_by('email', 'maria@ejemplo.com');
$carlos = get_user_by('email', 'carlos@ejemplo.com');
$laura = get_user_by('email', 'laura@terranima.com');
$noelia = get_user_by('email', 'noelia@terranima.com');
$clara = get_user_by('email', 'clara@terranima.com');

if (!$maria || !$laura) {
    echo "error: faltan usuarios demo (ejecuta seed-users.php primero)\n";
    return;
}

/**
 * @param array<string, mixed> $spec
 */
function terranima_seed_documento($spec)
{
    $existing = get_posts(
        array(
            'post_type'      => Terranima_CPTs::DOCUMENTO,
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => 'terranima_seed_key',
            'meta_value'     => $spec['key'],
        )
    );
    if (!empty($existing)) {
        echo "skip documento {$spec['key']}\n";
        return;
    }

    wp_set_current_user((int) $spec['author']);

    $upload = wp_upload_dir();
    if (!empty($upload['error'])) {
        echo "error upload dir: {$upload['error']}\n";
        return;
    }

    $filename = $spec['filename'];
    $path = trailingslashit($upload['path']) . $filename;
    $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n{$spec['key']}\n";
    if (false === file_put_contents($path, $pdf)) {
        echo "error writing {$path}\n";
        return;
    }

    $attachment_id = wp_insert_attachment(
        array(
            'post_mime_type' => 'application/pdf',
            'post_title'     => sanitize_file_name(pathinfo($filename, PATHINFO_FILENAME)),
            'post_content'   => '',
            'post_status'    => 'inherit',
        ),
        $path
    );
    if (is_wp_error($attachment_id)) {
        echo 'error attachment: ' . $attachment_id->get_error_message() . "\n";
        return;
    }

    $post_id = wp_insert_post(
        array(
            'post_type'   => Terranima_CPTs::DOCUMENTO,
            'post_status' => 'publish',
            'post_title'  => $spec['title'],
            'post_author' => (int) $spec['author'],
        ),
        true
    );
    if (is_wp_error($post_id)) {
        echo 'error documento: ' . $post_id->get_error_message() . "\n";
        return;
    }

    update_post_meta($post_id, Terranima_Documentos::META_ATTACHMENT, (int) $attachment_id);
    update_post_meta($post_id, Terranima_Documentos::META_FAMILIA, (int) $spec['familia']);
    update_post_meta($post_id, Terranima_Documentos::META_ANIMAL, $spec['animal']);
    update_post_meta($post_id, Terranima_Documentos::META_CATEGORIA, $spec['categoria']);
    update_post_meta($post_id, Terranima_Documentos::META_SUBIDO_POR, $spec['subido']);
    if ($spec['subido'] === 'profesional' && !empty($spec['rol'])) {
        update_post_meta($post_id, Terranima_Documentos::META_ROL, $spec['rol']);
    }
    update_post_meta($post_id, 'terranima_seed_key', $spec['key']);
    echo "documento {$post_id}: {$spec['title']}\n";
}

$docs = array(
    array(
        'key'       => 'maria-tutor-analisis-luna',
        'author'    => $maria->ID,
        'familia'   => $maria->ID,
        'filename'  => 'analisis-luna-seed.pdf',
        'title'     => 'Análisis Luna (tutor)',
        'animal'    => 'Luna',
        'categoria' => 'analisis',
        'subido'    => 'cliente',
        'rol'       => '',
    ),
    array(
        'key'       => 'maria-laura-informe-rocky',
        'author'    => $laura->ID,
        'familia'   => $maria->ID,
        'filename'  => 'informe-educacion-rocky-seed.pdf',
        'title'     => 'Informe educación Rocky',
        'animal'    => 'Rocky',
        'categoria' => 'informe',
        'subido'    => 'profesional',
        'rol'       => 'Educación canina',
    ),
);

if ($noelia) {
    $docs[] = array(
        'key'       => 'maria-noelia-receta-luna',
        'author'    => $noelia->ID,
        'familia'   => $maria->ID,
        'filename'  => 'pauta-dieta-luna-seed.pdf',
        'title'     => 'Pauta dieta hipoalergénica Luna',
        'animal'    => 'Luna',
        'categoria' => 'receta',
        'subido'    => 'profesional',
        'rol'       => 'Nutrición',
    );
}

if ($carlos) {
    $docs[] = array(
        'key'       => 'carlos-tutor-vacuna-nala',
        'author'    => $carlos->ID,
        'familia'   => $carlos->ID,
        'filename'  => 'cartilla-nala-seed.pdf',
        'title'     => 'Cartilla vacunación Nala',
        'animal'    => 'Nala',
        'categoria' => 'vacunacion',
        'subido'    => 'cliente',
        'rol'       => '',
    );
    if ($laura) {
        $docs[] = array(
            'key'       => 'carlos-laura-informe-nala',
            'author'    => $laura->ID,
            'familia'   => $carlos->ID,
            'filename'  => 'informe-paseo-nala-seed.pdf',
            'title'     => 'Notas de paseo Nala',
            'animal'    => 'Nala',
            'categoria' => 'informe',
            'subido'    => 'profesional',
            'rol'       => 'Educación canina',
        );
    }
}

if ($clara) {
    $docs[] = array(
        'key'       => 'maria-clara-informe-familia',
        'author'    => $clara->ID,
        'familia'   => $maria->ID,
        'filename'  => 'notas-sesion-familiar-seed.pdf',
        'title'     => 'Notas sesión familiar',
        'animal'    => 'Familia',
        'categoria' => 'informe',
        'subido'    => 'profesional',
        'rol'       => 'Terapia familiar',
    );
}

foreach ($docs as $doc) {
    terranima_seed_documento($doc);
}

echo "done\n";
