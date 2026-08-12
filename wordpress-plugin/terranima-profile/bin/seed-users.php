<?php
/**
 * Crea usuarios demo Terranima (solo desarrollo local).
 * Uso: docker exec terranima-wordpress-1 wp eval-file wp-content/plugins/terranima-profile/bin/seed-users.php --allow-root
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

require_once ABSPATH . 'wp-admin/includes/user.php';

$users = array(
    array(
        'login'       => 'maria',
        'email'       => 'maria@ejemplo.com',
        'password'    => '1234',
        'display'     => 'María García López',
        'role'        => Terranima_Roles::ROLE_FAMILIA,
        'meta'        => array(
            Terranima_Roles::META_TIPO          => Terranima_Roles::TIPO_FAMILIA,
            Terranima_Roles::META_NUMERO_SOCIO  => 'TA-2026-00482',
            Terranima_Roles::META_DIRECCION     => 'Carrer de la Pau 12, 08001 Barcelona',
            Terranima_Roles::META_NOMBRE_FAMILIA => 'Familia García López',
        ),
    ),
    array(
        'login'       => 'laura',
        'email'       => 'laura@terranima.com',
        'password'    => '1234',
        'display'     => 'Laura Vidal',
        'role'        => Terranima_Roles::ROLE_PROFESIONAL,
        'meta'        => array(
            Terranima_Roles::META_TIPO         => Terranima_Roles::TIPO_PROFESIONAL,
            Terranima_Roles::META_ESPECIALIDAD => 'educacion_canina',
        ),
    ),
    array(
        'login'       => 'noelia',
        'email'       => 'noelia@terranima.com',
        'password'    => '1234',
        'display'     => 'Noelia Serra',
        'role'        => Terranima_Roles::ROLE_PROFESIONAL,
        'meta'        => array(
            Terranima_Roles::META_TIPO         => Terranima_Roles::TIPO_PROFESIONAL,
            Terranima_Roles::META_ESPECIALIDAD => 'nutricion',
        ),
    ),
);

foreach ($users as $spec) {
    $existing = get_user_by('email', $spec['email']);
    if ($existing) {
        wp_update_user(
            array(
                'ID'           => $existing->ID,
                'display_name' => $spec['display'],
                'role'         => $spec['role'],
            )
        );
        $user_id = $existing->ID;
        echo "updated: {$spec['email']}\n";
    } else {
        $user_id = wp_insert_user(
            array(
                'user_login'   => $spec['login'],
                'user_email'   => $spec['email'],
                'user_pass'    => $spec['password'],
                'display_name' => $spec['display'],
                'role'         => $spec['role'],
            )
        );
        if (is_wp_error($user_id)) {
            echo "error {$spec['email']}: " . $user_id->get_error_message() . "\n";
            continue;
        }
        echo "created: {$spec['email']}\n";
    }

    foreach ($spec['meta'] as $key => $value) {
        update_user_meta($user_id, $key, $value);
    }
}

echo "done\n";
