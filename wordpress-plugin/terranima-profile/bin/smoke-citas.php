<?php
$user = Terranima_Auth::authenticate('laura@terranima.com', '1234');
if (is_wp_error($user)) {
    echo 'auth_error: ' . $user->get_error_message() . PHP_EOL;
    exit(1);
}
wp_set_current_user($user->ID);
$citas = Terranima_Citas::query(array('especialidad' => 'educacion_canina'));
echo 'ok citas=' . count($citas) . PHP_EOL;
foreach ($citas as $c) {
    echo $c['id'] . ' ' . $c['estado'] . ' ' . $c['tipo'] . PHP_EOL;
}
foreach ($citas as $c) {
    if ($c['estado'] === 'pendiente') {
        Terranima_Citas::set_estado((int) $c['id'], 'confirmada');
        $again = Terranima_Citas::serialize((int) $c['id']);
        echo 'accepted ' . $again['id'] . ' -> ' . $again['estado'] . PHP_EOL;
        break;
    }
}
