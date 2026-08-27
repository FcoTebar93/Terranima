<?php
/**
 * Crea citas demo persistentes (solo desarrollo). Idempotente por fecha+hora+familia.
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-citas.php
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

if ($carlos) {
    $samples[] = array(
        'fecha'        => '2026-08-25',
        'hora'         => '10:30',
        'tipo'         => 'Educación canina',
        'especialidad' => 'educacion_canina',
        'animal'       => 'Nala',
        'familia'      => $carlos->ID,
        'estado'       => 'pendiente',
        'notas'        => 'Socialización en paseos urbanos. Nala tira de la correa.',
    );
    $samples[] = array(
        'fecha'        => '2026-09-08',
        'hora'         => '12:00',
        'tipo'         => 'Nutrición',
        'especialidad' => 'nutricion',
        'animal'       => 'Nala',
        'familia'      => $carlos->ID,
        'estado'       => 'confirmada',
        'notas'        => 'Revisión de ración y snacks en paseo.',
    );
}

wp_set_current_user(1);

foreach ($samples as $row) {
    $found = get_posts(
        array(
            'post_type'      => Terranima_CPTs::CITA,
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_query'     => array(
                'relation' => 'AND',
                array('key' => Terranima_Citas::META_FECHA, 'value' => $row['fecha']),
                array('key' => Terranima_Citas::META_HORA, 'value' => $row['hora']),
                array(
                    'key'   => Terranima_Citas::META_FAMILIA_USER,
                    'value' => (int) $row['familia'],
                    'type'  => 'NUMERIC',
                ),
            ),
        )
    );
    if (!empty($found)) {
        echo "skip cita {$row['fecha']} {$row['hora']} familia {$row['familia']}\n";
        continue;
    }

    $id = Terranima_Citas::create(
        array(
            'fecha'            => $row['fecha'],
            'hora'             => $row['hora'],
            'tipo'             => $row['tipo'],
            'especialidad'     => $row['especialidad'],
            'animal'           => $row['animal'],
            'notas'            => $row['notas'],
            'familia_user_id'  => $row['familia'],
            'estado'           => $row['estado'],
            'solo_profesional' => !empty($row['solo']),
        )
    );
    if (is_wp_error($id)) {
        echo 'error: ' . $id->get_error_message() . "\n";
        continue;
    }
    update_post_meta($id, 'terranima_seed', '1');
    echo "cita {$id}: {$row['tipo']} {$row['estado']} {$row['fecha']}\n";
}

echo "done\n";
