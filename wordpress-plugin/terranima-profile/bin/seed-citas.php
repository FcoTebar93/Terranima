<?php
/**
 * Crea citas demo persistentes (solo desarrollo).
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-citas.php --allow-root
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

$maria = get_user_by('email', 'maria@ejemplo.com');
$carlos = get_user_by('email', 'carlos@ejemplo.com');
if (!$maria) {
    echo "error: falta usuario maria@ejemplo.com (ejecuta seed-users.php primero)\n";
    exit(1);
}

$existing = get_posts(
    array(
        'post_type'      => Terranima_CPTs::CITA,
        'posts_per_page' => 1,
        'fields'         => 'ids',
        'meta_key'       => 'terranima_seed',
        'meta_value'     => '1',
    )
);

if (!empty($existing)) {
    echo "citas seed ya existen, omitiendo\n";
    exit(0);
}

$samples = array(
    array(
        'fecha'        => '2026-08-22',
        'hora'         => '11:00',
        'tipo'         => 'Educación canina',
        'especialidad' => 'educacion_canina',
        'animal'       => 'Rocky',
        'familia'      => $maria->ID,
        'estado'       => 'confirmada',
        'notas'        => '',
    ),
    array(
        'fecha'        => '2026-08-18',
        'hora'         => '10:00',
        'tipo'         => 'Educación canina',
        'especialidad' => 'educacion_canina',
        'animal'       => 'Rocky',
        'familia'      => $maria->ID,
        'estado'       => 'pendiente',
        'notas'        => 'Solicitud del tutor: trabajo con ruidos fuertes.',
    ),
    array(
        'fecha'        => '2026-09-03',
        'hora'         => '16:30',
        'tipo'         => 'Nutrición',
        'especialidad' => 'nutricion',
        'animal'       => 'Luna',
        'familia'      => $maria->ID,
        'estado'       => 'pendiente',
        'notas'        => 'Seguimiento dieta hipoalergénica.',
    ),
    array(
        'fecha'        => '2026-08-28',
        'hora'         => '18:00',
        'tipo'         => 'Grupo de desarrollo',
        'especialidad' => 'educacion_canina',
        'animal'       => 'Rocky',
        'familia'      => $maria->ID,
        'estado'       => 'confirmada',
        'notas'        => 'Sesión 3 del bono de grupos de desarrollo.',
        'solo'         => true,
    ),
);

// Usuario actual = admin para author
wp_set_current_user(1);

foreach ($samples as $row) {
    $id = Terranima_Citas::create(
        array(
            'fecha'           => $row['fecha'],
            'hora'            => $row['hora'],
            'tipo'            => $row['tipo'],
            'especialidad'    => $row['especialidad'],
            'animal'          => $row['animal'],
            'notas'           => $row['notas'],
            'familia_user_id' => $row['familia'],
            'estado'          => $row['estado'],
            'solo_profesional'=> !empty($row['solo']),
        )
    );
    if (is_wp_error($id)) {
        echo 'error: ' . $id->get_error_message() . "\n";
        continue;
    }
    update_post_meta($id, 'terranima_seed', '1');
    echo "cita {$id}: {$row['tipo']} {$row['estado']}\n";
}

echo "done\n";
