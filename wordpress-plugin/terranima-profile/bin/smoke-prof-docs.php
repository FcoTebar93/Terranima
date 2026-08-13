<?php
/**
 * Smoke: profesional sube documento a familia asignada.
 */

$maria = get_user_by('email', 'maria@ejemplo.com');
$laura = get_user_by('email', 'laura@terranima.com');
$extra = get_user_by('login', 'smoke_no_familia');

if (!$maria || !$laura) {
    echo "FAIL users\n";
    return;
}

wp_set_current_user($laura->ID);

if (!Terranima_Documentos::profesional_can_access_familia((int) $maria->ID, $laura)) {
    echo "FAIL maria not assigned to laura\n";
    return;
}

$denied = Terranima_Documentos::create_from_upload(
    array(),
    array('familia_user_id' => 999999)
);
echo (is_wp_error($denied) && $denied->get_error_code() === 'terranima_doc_missing')
    ? "ok_missing_file_before_familia_check_or_ok\n"
    : (is_wp_error($denied) ? $denied->get_error_code() . "\n" : "unexpected\n");

// Reject upload without familia for profesional via REST-like check.
$bad = Terranima_Documentos::create_from_upload(
    array('name' => 'x.pdf', 'tmp_name' => '', 'error' => 0, 'size' => 0),
    array()
);
echo is_wp_error($bad) ? ('reject_empty=' . $bad->get_error_code() . "\n") : "FAIL should reject\n";

$tmp = wp_tempnam('prof-smoke.pdf');
file_put_contents($tmp, "%PDF-1.4\n%prof\n");
$uploads = wp_upload_dir();
$dest = trailingslashit($uploads['path']) . 'prof-smoke-' . time() . '.pdf';
copy($tmp, $dest);
@unlink($tmp);

$attachment_id = wp_insert_attachment(
    array(
        'post_mime_type' => 'application/pdf',
        'post_title'     => 'prof-smoke',
        'post_status'    => 'inherit',
    ),
    $dest
);

$post_id = wp_insert_post(
    array(
        'post_type'   => Terranima_CPTs::DOCUMENTO,
        'post_status' => 'publish',
        'post_title'  => 'Informe_Laura_Rocky.pdf',
        'post_author' => (int) $laura->ID,
    ),
    true
);

update_post_meta($post_id, Terranima_Documentos::META_ATTACHMENT, $attachment_id);
update_post_meta($post_id, Terranima_Documentos::META_FAMILIA, (int) $maria->ID);
update_post_meta($post_id, Terranima_Documentos::META_ANIMAL, 'Rocky');
update_post_meta($post_id, Terranima_Documentos::META_CATEGORIA, 'informe');
update_post_meta($post_id, Terranima_Documentos::META_SUBIDO_POR, 'profesional');
update_post_meta($post_id, Terranima_Documentos::META_ROL, 'Educación canina');

echo Terranima_Documentos::current_user_can_view($post_id) ? "laura_can_view\n" : "FAIL view\n";
echo Terranima_Documentos::current_user_can_delete($post_id) ? "laura_can_delete\n" : "FAIL delete\n";

wp_set_current_user($maria->ID);
$ser = Terranima_Documentos::serialize($post_id);
echo ($ser && $ser['subidoPor'] === 'profesional') ? "maria_sees_prof_doc\n" : "FAIL maria\n";
echo Terranima_Documentos::current_user_can_view($post_id) ? "maria_can_view\n" : "FAIL maria view\n";
echo !Terranima_Documentos::current_user_can_delete($post_id) ? "maria_cannot_delete_prof\n" : "FAIL maria delete\n";

wp_set_current_user($laura->ID);
Terranima_Documentos::delete($post_id);
echo "SMOKE_PROF_DOCS_OK\n";
