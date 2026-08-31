<?php
$emails = array('maria@ejemplo.com', 'carlos@ejemplo.com');
foreach ($emails as $email) {
    $u = get_user_by('email', $email);
    if (!$u) {
        echo "missing $email\n";
        continue;
    }
    $planes = Terranima_Planes::query_for_familia((int) $u->ID);
    if (!$planes) {
        $id = Terranima_Planes::ensure_for_familia((int) $u->ID);
        echo "$email created=$id\n";
        $planes = Terranima_Planes::query_for_familia((int) $u->ID);
    }
    foreach ($planes as $p) {
        update_post_meta((int) $p['id'], Terranima_Planes::META_SESIONES_USADAS, 0);
        update_post_meta((int) $p['id'], Terranima_Planes::META_ESTADO, Terranima_Planes::ESTADO_ACTIVO);
        $again = Terranima_Planes::serialize((int) $p['id']);
        echo $email . ' plan=' . $p['id'] . ' restantes=' . $again['sesionesRestantes'] . "\n";
    }
}
