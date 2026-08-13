<?php
/**
 * Crea conversaciones y mensajes demo (solo desarrollo local).
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-chats.php
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

Terranima_DB::maybe_upgrade();

$maria = get_user_by('email', 'maria@ejemplo.com');
$laura = get_user_by('email', 'laura@terranima.com');
$noelia = get_user_by('email', 'noelia@terranima.com');

if (!$maria || !$laura || !$noelia) {
    echo "error: faltan usuarios demo (ejecuta seed-users.php primero)\n";
    return;
}

global $wpdb;
$table = Terranima_DB::table_conversations();
$messages = Terranima_DB::table_messages();

/**
 * @param array<string, mixed> $data
 * @param array<int, array{sender:int, body:string, days_ago?:int, hour?:string}> $msgs
 */
function terranima_seed_conversation($data, $msgs)
{
    global $wpdb;
    $table = Terranima_DB::table_conversations();
    $messages = Terranima_DB::table_messages();

    $where_sql = $wpdb->prepare(
        "familia_user_id = %d AND especialidad = %s AND ambito = %s",
        $data['familia_user_id'],
        $data['especialidad'],
        $data['ambito']
    );
    if (!empty($data['animal_nombre'])) {
        $where_sql .= $wpdb->prepare(' AND animal_nombre = %s', $data['animal_nombre']);
    } else {
        $where_sql .= ' AND (animal_nombre IS NULL OR animal_nombre = \'\')';
    }

    // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
    $existing = (int) $wpdb->get_var("SELECT id FROM {$table} WHERE {$where_sql} LIMIT 1");
    if ($existing) {
        echo "skip conversation #{$existing}\n";
        return $existing;
    }

    $now = current_time('mysql');
    $wpdb->insert(
        $table,
        array(
            'familia_user_id'     => $data['familia_user_id'],
            'profesional_user_id' => $data['profesional_user_id'],
            'especialidad'        => $data['especialidad'],
            'ambito'              => $data['ambito'],
            'animal_nombre'       => $data['animal_nombre'] ?? null,
            'created_at'          => $now,
            'updated_at'          => $now,
        )
    );
    $cid = (int) $wpdb->insert_id;
    if (!$cid) {
        echo "error creating conversation\n";
        return 0;
    }

    foreach ($msgs as $m) {
        $days = isset($m['days_ago']) ? (int) $m['days_ago'] : 0;
        $hour = isset($m['hour']) ? $m['hour'] : '12:00:00';
        $ts = strtotime("-{$days} days") ?: time();
        $created = gmdate('Y-m-d', $ts) . ' ' . $hour;
        // Convert to local WP time roughly.
        $created = get_date_from_gmt(gmdate('Y-m-d H:i:s', strtotime($created)));
        $wpdb->insert(
            $messages,
            array(
                'conversation_id' => $cid,
                'sender_user_id'  => $m['sender'],
                'body'            => $m['body'],
                'created_at'      => $created,
            )
        );
    }

    $wpdb->update($table, array('updated_at' => current_time('mysql')), array('id' => $cid));
    echo "created conversation #{$cid}\n";
    return $cid;
}

terranima_seed_conversation(
    array(
        'familia_user_id'     => (int) $maria->ID,
        'profesional_user_id' => (int) $laura->ID,
        'especialidad'        => 'educacion_canina',
        'ambito'              => 'familia',
    ),
    array(
        array('sender' => (int) $maria->ID, 'body' => 'Rocky se pone nervioso con truenos. ¿Podéis acompañarnos con alguna pauta respetuosa para toda la familia?', 'days_ago' => 3, 'hour' => '16:20:00'),
        array('sender' => (int) $laura->ID, 'body' => 'Claro. Empezamos por un entorno seguro y refuerzo positivo; sin corrección punitiva.', 'days_ago' => 3, 'hour' => '17:05:00'),
        array('sender' => (int) $maria->ID, 'body' => 'Perfecto, la pedimos desde el portal. Gracias.', 'days_ago' => 3, 'hour' => '17:40:00'),
        array('sender' => (int) $laura->ID, 'body' => 'Hola María, ¿cómo estáis estos días con los ruidos en casa?', 'days_ago' => 0, 'hour' => '09:30:00'),
    )
);

terranima_seed_conversation(
    array(
        'familia_user_id'     => (int) $maria->ID,
        'profesional_user_id' => (int) $noelia->ID,
        'especialidad'        => 'nutricion',
        'ambito'              => 'animal',
        'animal_nombre'       => 'Luna',
    ),
    array(
        array('sender' => (int) $noelia->ID, 'body' => 'Hola María. Revisando las notas de Luna, te proponemos ajustar la dieta hipoalergénica.', 'days_ago' => 0, 'hour' => '08:45:00'),
    )
);

terranima_seed_conversation(
    array(
        'familia_user_id'     => (int) $maria->ID,
        'profesional_user_id' => (int) $noelia->ID,
        'especialidad'        => 'nutricion',
        'ambito'              => 'animal',
        'animal_nombre'       => 'Rocky',
    ),
    array(
        array('sender' => (int) $noelia->ID, 'body' => 'Tras la gastroenteritis de Rocky, mantenemos la transición a dieta blanda unos días más.', 'days_ago' => 15, 'hour' => '11:20:00'),
        array('sender' => (int) $maria->ID, 'body' => 'De acuerdo, gracias. Va comiendo mejor.', 'days_ago' => 15, 'hour' => '12:05:00'),
    )
);

echo "done\n";
