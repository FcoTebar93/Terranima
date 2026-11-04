<?php
/**
 * Crea usuarios demo Terranima (solo desarrollo local).
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-users.php
 *
 * Profesionales primero (para poder asignarlos a las familias).
 * Familias:     maria@ejemplo.com, carlos@ejemplo.com
 * Profesionales: laura@terranima.com (educación), noelia@terranima.com (nutrición)
 * Contraseña común: 1234
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

require_once ABSPATH . 'wp-admin/includes/user.php';

$users = array(
    array(
        'login'    => 'laura',
        'email'    => 'laura@terranima.com',
        'password' => '1234',
        'display'  => 'Laura Vidal',
        'status'   => 'educador',
        'meta'     => array(
            Terranima_Roles::META_TIPO         => Terranima_Roles::TIPO_PROFESIONAL,
            Terranima_Roles::META_ACTIVO       => '1',
            Terranima_Roles::META_ESPECIALIDAD => 'educacion_canina',
        ),
    ),
    array(
        'login'    => 'noelia',
        'email'    => 'noelia@terranima.com',
        'password' => '1234',
        'display'  => 'Noelia Serra',
        'status'   => 'nutricionista',
        'meta'     => array(
            Terranima_Roles::META_TIPO         => Terranima_Roles::TIPO_PROFESIONAL,
            Terranima_Roles::META_ACTIVO       => '1',
            Terranima_Roles::META_ESPECIALIDAD => 'nutricion',
        ),
    ),
    array(
        'login'    => 'maria',
        'email'    => 'maria@ejemplo.com',
        'password' => '1234',
        'display'  => 'María García López',
        'status'   => 'familia',
        'meta'     => array(
            Terranima_Roles::META_TIPO           => Terranima_Roles::TIPO_FAMILIA,
            Terranima_Roles::META_ACTIVO         => '1',
            Terranima_Roles::META_NUMERO_SOCIO   => 'TA-2026-00482',
            Terranima_Roles::META_DIRECCION      => 'Carrer de la Pau 12, 08001 Barcelona',
            Terranima_Roles::META_NOMBRE_FAMILIA => 'Familia García López',
        ),
    ),
    array(
        'login'    => 'carlos',
        'email'    => 'carlos@ejemplo.com',
        'password' => '1234',
        'display'  => 'Carlos Ruiz Soto',
        'status'   => 'familia',
        'meta'     => array(
            Terranima_Roles::META_TIPO           => Terranima_Roles::TIPO_FAMILIA,
            Terranima_Roles::META_ACTIVO         => '1',
            Terranima_Roles::META_NUMERO_SOCIO   => 'TA-2026-00501',
            Terranima_Roles::META_DIRECCION      => 'Av. Diagonal 450, 08006 Barcelona',
            Terranima_Roles::META_NOMBRE_FAMILIA => 'Familia Ruiz Soto',
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
            )
        );
        $user_id = $existing->ID;
        wp_set_password($spec['password'], $user_id);
        echo "updated: {$spec['email']}\n";
    } else {
        $user_id = wp_insert_user(
            array(
                'user_login'   => $spec['login'],
                'user_email'   => $spec['email'],
                'user_pass'    => $spec['password'],
                'display_name' => $spec['display'],
                'role'         => 'subscriber',
            )
        );
        if (is_wp_error($user_id)) {
            echo "error {$spec['email']}: " . $user_id->get_error_message() . "\n";
            continue;
        }
        echo "created: {$spec['email']}\n";
    }

    $wp_user = get_userdata($user_id);
    if ($wp_user) {
        Terranima_User_Admin::apply_status($wp_user, $spec['status']);
    }

    foreach ($spec['meta'] as $key => $value) {
        update_user_meta($user_id, $key, $value);
    }

    if ($spec['status'] === 'familia' && class_exists('Terranima_Asignaciones')) {
        Terranima_Asignaciones::ensure_for_familia((int) $user_id, true);
        $asig = Terranima_Asignaciones::get_ids((int) $user_id);
        echo "  equipo: educador={$asig['educador']} nutricionista={$asig['nutricionista']}\n";
    }
}

echo "done\n";
echo "password (todas): 1234\n";
echo "familias: maria@ejemplo.com · carlos@ejemplo.com\n";
echo "equipo:   laura@terranima.com · noelia@terranima.com\n";
