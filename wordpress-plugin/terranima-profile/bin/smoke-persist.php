<?php
/**
 * Smoke test documentos + chats (CLI).
 */

Terranima_DB::maybe_upgrade();

$maria = get_user_by('email', 'maria@ejemplo.com');
$laura = get_user_by('email', 'laura@terranima.com');
if (!$maria || !$laura) {
    echo "FAIL missing users\n";
    return;
}

wp_set_current_user($maria->ID);
$chats = Terranima_Chat::list_for_current_user();
echo 'chats_familia=' . count($chats) . "\n";
if (count($chats) < 1) {
    echo "FAIL no chats\n";
    return;
}

$first = $chats[0];
echo 'first=' . $first['id'] . ' ' . $first['nombre'] . "\n";

$msg = Terranima_Chat::send_message((int) $first['id'], 'Hola desde smoke persistente');
if (is_wp_error($msg)) {
    echo 'FAIL send: ' . $msg->get_error_message() . "\n";
    return;
}
echo 'msg_ok=' . $msg['id'] . "\n";

wp_set_current_user($laura->ID);
$prof_chats = Terranima_Chat::list_for_current_user();
echo 'chats_laura=' . count($prof_chats) . "\n";

$familias = Terranima_Chat::list_familias();
echo 'familias=' . count($familias) . "\n";

// Documento sintético: crear attachment mínimo.
wp_set_current_user($maria->ID);
$tmp = wp_tempnam('terranima-smoke.pdf');
file_put_contents($tmp, "%PDF-1.4\n%smoke\n");
$file = array(
    'name'     => 'smoke-test.pdf',
    'type'     => 'application/pdf',
    'tmp_name' => $tmp,
    'error'    => 0,
    'size'     => filesize($tmp),
);
// wp_handle_upload needs is_uploaded_file; bypass with filter for CLI.
add_filter('wp_check_filetype_and_ext', static function ($data, $file, $filename, $mimes) {
    unset($file, $mimes);
    return array(
        'ext'             => 'pdf',
        'type'            => 'application/pdf',
        'proper_filename' => $filename,
    );
}, 10, 4);

// For CLI, copy into uploads and create attachment manually is more reliable.
$uploads = wp_upload_dir();
$dest = trailingslashit($uploads['path']) . 'smoke-test-' . time() . '.pdf';
copy($tmp, $dest);
@unlink($tmp);

$attachment_id = wp_insert_attachment(
    array(
        'post_mime_type' => 'application/pdf',
        'post_title'     => 'smoke-test',
        'post_content'   => '',
        'post_status'    => 'inherit',
    ),
    $dest
);

$post_id = wp_insert_post(
    array(
        'post_type'   => Terranima_CPTs::DOCUMENTO,
        'post_status' => 'publish',
        'post_title'  => 'smoke-test.pdf',
        'post_author' => (int) $maria->ID,
    ),
    true
);

if (is_wp_error($post_id)) {
    echo 'FAIL doc: ' . $post_id->get_error_message() . "\n";
    return;
}

update_post_meta($post_id, Terranima_Documentos::META_ATTACHMENT, $attachment_id);
update_post_meta($post_id, Terranima_Documentos::META_FAMILIA, (int) $maria->ID);
update_post_meta($post_id, Terranima_Documentos::META_ANIMAL, 'Luna');
update_post_meta($post_id, Terranima_Documentos::META_CATEGORIA, 'otro');
update_post_meta($post_id, Terranima_Documentos::META_SUBIDO_POR, 'cliente');

$docs = Terranima_Documentos::query(array('familia_user_id' => (int) $maria->ID));
echo 'docs=' . count($docs) . "\n";
$ser = Terranima_Documentos::serialize($post_id);
echo 'doc_url=' . (!empty($ser['url']) ? 'ok' : 'missing') . "\n";

$del = Terranima_Documentos::delete($post_id);
echo is_wp_error($del) ? ('FAIL delete: ' . $del->get_error_message() . "\n") : "delete_ok\n";

echo "SMOKE_OK\n";
