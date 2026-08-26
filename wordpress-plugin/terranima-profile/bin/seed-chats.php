<?php
/**
 * Crea conversaciones y mensajes demo (familia ↔ profesional y profesional ↔ profesional).
 * Uso: docker compose run --rm wpcli wp eval-file wp-content/plugins/terranima-profile/bin/seed-chats.php
 */

if (!defined('ABSPATH')) {
    require '/var/www/html/wp-load.php';
}

Terranima_DB::maybe_upgrade();

$maria = get_user_by('email', 'maria@ejemplo.com');
$carlos = get_user_by('email', 'carlos@ejemplo.com');
$laura = get_user_by('email', 'laura@terranima.com');
$noelia = get_user_by('email', 'noelia@terranima.com');
$clara = get_user_by('email', 'clara@terranima.com');

if (!$maria || !$laura || !$noelia) {
    echo "error: faltan usuarios demo (ejecuta seed-users.php primero)\n";
    return;
}

/**
 * @param array<string, mixed> $data
 * @param array<int, array{sender:int, body:string, days_ago?:int, hour?:string}> $msgs
 * @return int
 */
function terranima_seed_conversation($data, $msgs)
{
    global $wpdb;
    $table = Terranima_DB::table_conversations();
    $messages = Terranima_DB::table_messages();

    $ambito = isset($data['ambito']) ? $data['ambito'] : 'familia';
    if ($ambito === 'equipo') {
        $me = (int) $data['profesional_user_id'];
        $peer = (int) $data['peer_user_id'];
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $existing = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$table} WHERE ambito = 'equipo'
                AND ((profesional_user_id = %d AND peer_user_id = %d) OR (profesional_user_id = %d AND peer_user_id = %d))
                LIMIT 1",
                $me,
                $peer,
                $peer,
                $me
            )
        );
    } else {
        $where_sql = $wpdb->prepare(
            "familia_user_id = %d AND especialidad = %s AND ambito = %s",
            $data['familia_user_id'],
            $data['especialidad'],
            $ambito
        );
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $existing = (int) $wpdb->get_var("SELECT id FROM {$table} WHERE {$where_sql} LIMIT 1");
    }

    if ($existing) {
        echo "skip conversation #{$existing}\n";
        return $existing;
    }

    $now = current_time('mysql');
    $insert = array(
        'familia_user_id'     => isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : 0,
        'profesional_user_id' => (int) $data['profesional_user_id'],
        'especialidad'        => $data['especialidad'],
        'ambito'              => $ambito,
        'animal_nombre'       => $data['animal_nombre'] ?? null,
        'created_at'          => $now,
        'updated_at'          => $now,
    );
    if (!empty($data['peer_user_id'])) {
        $insert['peer_user_id'] = (int) $data['peer_user_id'];
    }
    $wpdb->insert($table, $insert);
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
    echo "created conversation #{$cid} ({$ambito} {$data['especialidad']})\n";
    return $cid;
}

// --- Familia García López ↔ cada especialidad ---
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
        'ambito'              => 'familia',
    ),
    array(
        array('sender' => (int) $noelia->ID, 'body' => 'Tras la gastroenteritis de Rocky, mantenemos la transición a dieta blanda unos días más.', 'days_ago' => 15, 'hour' => '11:20:00'),
        array('sender' => (int) $maria->ID, 'body' => 'De acuerdo, gracias. Va comiendo mejor.', 'days_ago' => 15, 'hour' => '12:05:00'),
        array('sender' => (int) $noelia->ID, 'body' => 'Hola María. Revisando las notas de Luna, te proponemos ajustar la dieta hipoalergénica.', 'days_ago' => 0, 'hour' => '08:45:00'),
    )
);

if ($clara) {
    terranima_seed_conversation(
        array(
            'familia_user_id'     => (int) $maria->ID,
            'profesional_user_id' => (int) $clara->ID,
            'especialidad'        => 'terapia_familiar',
            'ambito'              => 'familia',
        ),
        array(
            array('sender' => (int) $maria->ID, 'body' => 'Nos gustaría una sesión para hablar de cómo vivimos los ruidos en casa, no solo Rocky.', 'days_ago' => 5, 'hour' => '10:10:00'),
            array('sender' => (int) $clara->ID, 'body' => 'Por supuesto. Podemos empezar por lo que os preocupa a vosotras y cómo os organizáis cuando hay tormenta.', 'days_ago' => 5, 'hour' => '11:00:00'),
            array('sender' => (int) $clara->ID, 'body' => 'Te he propuesto una primera cita el 10 de septiembre. Si no encaja, dímelo y la movemos.', 'days_ago' => 1, 'hour' => '09:15:00'),
        )
    );
}

// --- Familia Ruiz Soto ↔ educadora y nutricionista ---
if ($carlos) {
    terranima_seed_conversation(
        array(
            'familia_user_id'     => (int) $carlos->ID,
            'profesional_user_id' => (int) $laura->ID,
            'especialidad'        => 'educacion_canina',
            'ambito'              => 'familia',
        ),
        array(
            array('sender' => (int) $carlos->ID, 'body' => 'Nala tira mucho de la correa al ver otros perros. ¿Podemos trabajarlo sin tirones?', 'days_ago' => 4, 'hour' => '18:40:00'),
            array('sender' => (int) $laura->ID, 'body' => 'Sí. Empezamos por distancia y refuerzo cuando mira hacia ti. Te dejo una cita pendiente para el 25 de agosto.', 'days_ago' => 4, 'hour' => '19:05:00'),
            array('sender' => (int) $carlos->ID, 'body' => 'Perfecto, la confirmo cuando pueda desde Citas. Gracias.', 'days_ago' => 3, 'hour' => '08:12:00'),
        )
    );

    terranima_seed_conversation(
        array(
            'familia_user_id'     => (int) $carlos->ID,
            'profesional_user_id' => (int) $noelia->ID,
            'especialidad'        => 'nutricion',
            'ambito'              => 'familia',
        ),
        array(
            array('sender' => (int) $noelia->ID, 'body' => 'Hola Carlos. Para Nala, revisamos ración y snacks de paseo en la cita del 8 de septiembre.', 'days_ago' => 2, 'hour' => '13:20:00'),
            array('sender' => (int) $carlos->ID, 'body' => 'Genial. Ahora le doy premios cada vez que ve un perro; igual es demasiado.', 'days_ago' => 2, 'hour' => '13:45:00'),
        )
    );
}

// --- Chat interno del equipo (profesional ↔ profesional) ---
terranima_seed_conversation(
    array(
        'familia_user_id'     => (int) $maria->ID,
        'profesional_user_id' => (int) $laura->ID,
        'peer_user_id'        => (int) $noelia->ID,
        'especialidad'        => 'equipo',
        'ambito'              => 'equipo',
    ),
    array(
        array('sender' => (int) $laura->ID, 'body' => 'Noelia, en la familia García López Rocky está sensible a truenos. ¿La dieta blanda puede estar influyendo en el descanso?', 'days_ago' => 2, 'hour' => '10:00:00'),
        array('sender' => (int) $noelia->ID, 'body' => 'Puede, si aún está en transición. Te digo tras la cita de Luna el 3 de septiembre. Mientras, prioriza entorno seguro.', 'days_ago' => 2, 'hour' => '10:22:00'),
        array('sender' => (int) $laura->ID, 'body' => 'De acuerdo. Coordino con Clara si hace falta sesión familiar.', 'days_ago' => 1, 'hour' => '16:40:00'),
    )
);

if ($clara) {
    terranima_seed_conversation(
        array(
            'familia_user_id'     => (int) $maria->ID,
            'profesional_user_id' => (int) $laura->ID,
            'peer_user_id'        => (int) $clara->ID,
            'especialidad'        => 'equipo',
            'ambito'              => 'equipo',
        ),
        array(
            array('sender' => (int) $laura->ID, 'body' => 'Clara, María pide también acompañamiento familiar por los ruidos. ¿Puedes cogerlo tú?', 'days_ago' => 6, 'hour' => '12:15:00'),
            array('sender' => (int) $clara->ID, 'body' => 'Sí. Le he escrito y he dejado una cita pendiente el 10 de septiembre. Si ves algo en la ficha de Rocky, avísame.', 'days_ago' => 5, 'hour' => '09:40:00'),
        )
    );

    if ($carlos) {
        terranima_seed_conversation(
            array(
                'familia_user_id'     => (int) $carlos->ID,
                'profesional_user_id' => (int) $noelia->ID,
                'peer_user_id'        => (int) $clara->ID,
                'especialidad'        => 'equipo',
                'ambito'              => 'equipo',
            ),
            array(
                array('sender' => (int) $noelia->ID, 'body' => 'Clara, Carlos usa muchos snacks en el paseo con Nala. Coordinamos con Laura para no saturar el refuerzo.', 'days_ago' => 1, 'hour' => '11:05:00'),
                array('sender' => (int) $clara->ID, 'body' => 'Bien visto. En terapia podemos hablar de expectativas en el paseo, no solo de la correa.', 'days_ago' => 1, 'hour' => '11:30:00'),
            )
        );
    }
}

echo "done\n";
