<?php
/**
 * Chat (conversaciones + mensajes en tablas custom).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Chat
{
    /**
     * @param int $conversation_id
     * @return array<string, mixed>|null
     */
    public static function serialize_conversation($conversation_id, $include_messages = false)
    {
        global $wpdb;
        $table = Terranima_DB::table_conversations();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $conversation_id), ARRAY_A);
        if (!$row) {
            return null;
        }

        $familia_id = (int) $row['familia_user_id'];
        $familia_user = get_user_by('id', $familia_id);
        $familia_nombre = $familia_user
            ? ((string) get_user_meta($familia_id, Terranima_Roles::META_NOMBRE_FAMILIA, true) ?: Terranima_Auth::get_display_name($familia_user))
            : '';
        $tutor = $familia_user ? Terranima_Auth::get_display_name($familia_user) : '';
        $direccion = $familia_id ? (string) get_user_meta($familia_id, Terranima_Roles::META_DIRECCION, true) : '';
        $especialidad_slug = (string) $row['especialidad'];
        $especialidad = Terranima_Auth::especialidad_label($especialidad_slug) ?: $especialidad_slug;
        $ambito = (string) $row['ambito'];
        $animal = !empty($row['animal_nombre']) ? (string) $row['animal_nombre'] : null;
        $is_equipo = $ambito === 'equipo';

        $user_id = get_current_user_id();
        $tipo = Terranima_Auth::get_tipo();
        $no_leidos = self::unread_count((int) $row['id'], $user_id);

        $peer_id = isset($row['peer_user_id']) ? (int) $row['peer_user_id'] : 0;
        $creator_id = $row['profesional_user_id'] ? (int) $row['profesional_user_id'] : 0;
        $other_id = 0;
        if ($is_equipo) {
            $other_id = ($peer_id === (int) $user_id) ? $creator_id : $peer_id;
        }
        $other_user = $other_id ? get_user_by('id', $other_id) : null;
        $other_nombre = $other_user ? Terranima_Auth::get_display_name($other_user) : '';
        $other_esp_slug = $other_user ? (string) get_user_meta($other_user->ID, Terranima_Roles::META_ESPECIALIDAD, true) : '';
        $other_esp = $other_esp_slug ? (Terranima_Auth::especialidad_label($other_esp_slug) ?: $other_esp_slug) : '';

        $payload = array(
            'id'               => (string) $row['id'],
            'nombre'           => $is_equipo ? ($other_nombre ?: 'Profesional') : $especialidad,
            'especialidad'     => $is_equipo ? $other_esp_slug : $especialidad_slug,
            'especialidadLabel'=> $is_equipo ? ($other_esp ?: 'Equipo') : $especialidad,
            'ambito'           => $ambito,
            'kind'             => $is_equipo ? 'equipo' : 'cliente',
            'animal'           => $animal,
            'subtitulo'        => $is_equipo
                ? ($familia_nombre ? ('Sobre ' . $familia_nombre) : 'Chat interno')
                : ($ambito === 'familia' ? 'Chat familiar' : ($animal ?: '')),
            'familiaUserId'    => $familia_id ?: null,
            'familiaNombre'    => $familia_nombre,
            'tutor'            => $tutor,
            'direccion'        => $direccion,
            'profesionalUserId'=> $creator_id ?: null,
            'peerUserId'       => $other_id ?: null,
            'peerNombre'       => $other_nombre,
            'peerEspecialidad' => $other_esp,
            'noLeidos'         => $no_leidos,
            'enLinea'          => false,
            'updatedAt'        => (string) $row['updated_at'],
        );

        $messages = self::list_messages((int) $row['id']);
        $last = end($messages);
        $payload['preview'] = $last ? $last['texto'] : '';
        $payload['previewAutor'] = $last ? $last['autor'] : null;
        $payload['previewHora'] = $last ? $last['hora'] : '';
        $payload['previewFecha'] = $last ? $last['fecha'] : '';

        if ($include_messages) {
            $payload['mensajes'] = $messages;
        } else {
            $payload['mensajes'] = array();
        }

        unset($tipo);
        return $payload;
    }

    /**
     * @param int $user_id
     * @return array<int, array<string, mixed>>
     */
    public static function list_for_current_user()
    {
        global $wpdb;
        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $table = Terranima_DB::table_conversations();

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            $me = (int) $user->ID;
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT id FROM {$table}
                    WHERE (especialidad = %s AND ambito <> 'equipo')
                       OR (ambito = 'equipo' AND (profesional_user_id = %d OR peer_user_id = %d))
                    ORDER BY updated_at DESC LIMIT 100",
                    $esp,
                    $me,
                    $me
                ),
                ARRAY_A
            );
        } else {
            // Las familias nunca ven el chat interno del equipo.
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT id FROM {$table} WHERE familia_user_id = %d AND ambito <> 'equipo' ORDER BY updated_at DESC LIMIT 100",
                    (int) $user->ID
                ),
                ARRAY_A
            );
        }

        $out = array();
        foreach ($rows as $row) {
            $item = self::serialize_conversation((int) $row['id'], false);
            if ($item) {
                $out[] = $item;
            }
        }
        return $out;
    }

    /**
     * @param array<string, mixed> $data
     * @return int|WP_Error conversation id
     */
    public static function create_conversation($data)
    {
        global $wpdb;

        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);

        $familia_id = isset($data['familia_user_id']) ? (int) $data['familia_user_id'] : 0;
        $especialidad = isset($data['especialidad']) ? sanitize_key($data['especialidad']) : '';
        $ambito = isset($data['ambito']) ? sanitize_key($data['ambito']) : 'familia';
        $kind = isset($data['kind']) ? sanitize_key($data['kind']) : '';
        $animal = isset($data['animal']) ? sanitize_text_field($data['animal']) : '';

        if ($ambito === 'equipo' || $kind === 'equipo') {
            if ($tipo !== Terranima_Roles::TIPO_PROFESIONAL) {
                return new WP_Error('terranima_forbidden', __('El chat interno es solo para el equipo.', 'terranima-profile'), array('status' => 403));
            }

            $peer_id = isset($data['peer_user_id']) ? (int) $data['peer_user_id'] : 0;
            if ($peer_id <= 0 || $peer_id === (int) $user->ID) {
                return new WP_Error('terranima_chat_peer', __('Selecciona a otro profesional.', 'terranima-profile'), array('status' => 400));
            }
            $peer = get_user_by('id', $peer_id);
            if (!$peer || Terranima_Auth::get_tipo($peer) !== Terranima_Roles::TIPO_PROFESIONAL) {
                return new WP_Error('terranima_chat_peer', __('Esa cuenta no es un profesional.', 'terranima-profile'), array('status' => 400));
            }

            $me = (int) $user->ID;
            $table = Terranima_DB::table_conversations();
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$table} WHERE ambito = 'equipo'
                    AND ((profesional_user_id = %d AND peer_user_id = %d) OR (profesional_user_id = %d AND peer_user_id = %d))
                    LIMIT 1",
                    $me,
                    $peer_id,
                    $peer_id,
                    $me
                )
            );
            if ($existing) {
                if ($familia_id > 0) {
                    $wpdb->update(
                        $table,
                        array('familia_user_id' => $familia_id, 'updated_at' => current_time('mysql')),
                        array('id' => (int) $existing),
                        array('%d', '%s'),
                        array('%d')
                    );
                }
                return (int) $existing;
            }

            $now = current_time('mysql');
            $wpdb->insert(
                $table,
                array(
                    'familia_user_id'     => $familia_id,
                    'profesional_user_id' => $me,
                    'peer_user_id'        => $peer_id,
                    'especialidad'        => 'equipo',
                    'ambito'              => 'equipo',
                    'created_at'          => $now,
                    'updated_at'          => $now,
                )
            );
            if (!$wpdb->insert_id) {
                return new WP_Error('terranima_chat_create', __('No se pudo crear el chat.', 'terranima-profile'), array('status' => 500));
            }
            return (int) $wpdb->insert_id;
        }

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            $especialidad = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            if (!$familia_id) {
                return new WP_Error('terranima_chat_familia', __('Selecciona una familia.', 'terranima-profile'), array('status' => 400));
            }
            if ($especialidad === 'educacion_canina') {
                $ambito = 'familia';
                $animal = '';
            } else {
                $ambito = 'animal';
                if ($animal === '') {
                    return new WP_Error('terranima_chat_animal', __('Selecciona un animal.', 'terranima-profile'), array('status' => 400));
                }
            }
            $profesional_id = (int) $user->ID;
        } else {
            $familia_id = (int) $user->ID;
            if ($especialidad === '') {
                return new WP_Error('terranima_chat_esp', __('Indica la especialidad.', 'terranima-profile'), array('status' => 400));
            }
            // Map label to slug if needed.
            $especialidad = Terranima_Citas::especialidad_slug($especialidad);
            if ($especialidad === 'educacion_canina') {
                $ambito = 'familia';
                $animal = '';
            } else {
                $ambito = 'animal';
            }
            $profesional_id = Terranima_Citas::find_profesional_for_especialidad($especialidad) ?: null;
        }

        // Reutilizar conversación existente.
        $table = Terranima_DB::table_conversations();
        if ($ambito === 'familia') {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$table} WHERE familia_user_id = %d AND especialidad = %s AND ambito = 'familia' LIMIT 1",
                    $familia_id,
                    $especialidad
                )
            );
        } else {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$table} WHERE familia_user_id = %d AND especialidad = %s AND ambito = 'animal' AND animal_nombre = %s LIMIT 1",
                    $familia_id,
                    $especialidad,
                    $animal
                )
            );
        }

        if ($existing) {
            return (int) $existing;
        }

        $now = current_time('mysql');
        $row = array(
            'familia_user_id' => $familia_id,
            'especialidad'    => $especialidad,
            'ambito'          => $ambito,
            'created_at'      => $now,
            'updated_at'      => $now,
        );
        if ($profesional_id) {
            $row['profesional_user_id'] = (int) $profesional_id;
        }
        if ($animal !== '') {
            $row['animal_nombre'] = $animal;
        }
        $wpdb->insert($table, $row);

        if (!$wpdb->insert_id) {
            return new WP_Error('terranima_chat_create', __('No se pudo crear el chat.', 'terranima-profile'), array('status' => 500));
        }

        return (int) $wpdb->insert_id;
    }

    /**
     * @param int $conversation_id
     * @return array<int, array<string, mixed>>
     */
    public static function list_messages($conversation_id)
    {
        global $wpdb;
        $table = Terranima_DB::table_messages();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE conversation_id = %d AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 500",
                $conversation_id
            ),
            ARRAY_A
        );

        $out = array();
        foreach ($rows as $row) {
            $sender = get_user_by('id', (int) $row['sender_user_id']);
            $autor = 'cliente';
            $autor_esp = null;
            if ($sender && Terranima_Auth::get_tipo($sender) === Terranima_Roles::TIPO_PROFESIONAL) {
                $autor = 'profesional';
                $esp_slug = (string) get_user_meta($sender->ID, Terranima_Roles::META_ESPECIALIDAD, true);
                $autor_esp = Terranima_Auth::especialidad_label($esp_slug) ?: $esp_slug;
            }
            $ts = strtotime($row['created_at']);
            $out[] = array(
                'id'               => (string) $row['id'],
                'texto'            => (string) $row['body'],
                'autor'            => $autor,
                'autorNombre'      => $sender ? Terranima_Auth::get_display_name($sender) : '',
                'autorEspecialidad'=> $autor_esp,
                'senderId'         => (int) $row['sender_user_id'],
                'mio'              => (int) $row['sender_user_id'] === (int) get_current_user_id(),
                'hora'             => wp_date('H:i', $ts),
                'fecha'            => wp_date('Y-m-d', $ts),
                'leido'            => true,
            );
        }
        return $out;
    }

    /**
     * @param int    $conversation_id
     * @param string $body
     * @return array<string, mixed>|WP_Error
     */
    public static function send_message($conversation_id, $body)
    {
        global $wpdb;

        $body = trim(wp_strip_all_tags((string) $body));
        if ($body === '') {
            return new WP_Error('terranima_chat_empty', __('El mensaje está vacío.', 'terranima-profile'), array('status' => 400));
        }

        if (!self::current_user_can_access($conversation_id)) {
            return new WP_Error('terranima_forbidden', __('No puedes escribir en este chat.', 'terranima-profile'), array('status' => 403));
        }

        $now = current_time('mysql');
        $wpdb->insert(
            Terranima_DB::table_messages(),
            array(
                'conversation_id' => $conversation_id,
                'sender_user_id'  => get_current_user_id(),
                'body'            => $body,
                'created_at'      => $now,
            ),
            array('%d', '%d', '%s', '%s')
        );

        if (!$wpdb->insert_id) {
            return new WP_Error('terranima_chat_send', __('No se pudo enviar el mensaje.', 'terranima-profile'), array('status' => 500));
        }

        $wpdb->update(
            Terranima_DB::table_conversations(),
            array('updated_at' => $now),
            array('id' => $conversation_id),
            array('%s'),
            array('%d')
        );

        // Marcar como leído para el emisor.
        self::mark_read($conversation_id, get_current_user_id());

        $messages = self::list_messages($conversation_id);
        $last = end($messages);
        return $last ?: array();
    }

    /**
     * @param int $conversation_id
     * @param int $user_id
     * @return int
     */
    public static function unread_count($conversation_id, $user_id)
    {
        global $wpdb;
        $messages = Terranima_DB::table_messages();
        $reads = Terranima_DB::table_message_reads();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $count = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(m.id) FROM {$messages} m
                LEFT JOIN {$reads} r ON r.message_id = m.id AND r.user_id = %d
                WHERE m.conversation_id = %d AND m.deleted_at IS NULL AND m.sender_user_id <> %d AND r.message_id IS NULL",
                $user_id,
                $conversation_id,
                $user_id
            )
        );
        return $count;
    }

    /**
     * @param int $conversation_id
     * @param int $user_id
     */
    public static function mark_read($conversation_id, $user_id = 0)
    {
        global $wpdb;
        $user_id = $user_id ?: get_current_user_id();
        $messages = Terranima_DB::table_messages();
        $reads = Terranima_DB::table_message_reads();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT m.id FROM {$messages} m
                LEFT JOIN {$reads} r ON r.message_id = m.id AND r.user_id = %d
                WHERE m.conversation_id = %d AND m.deleted_at IS NULL AND r.message_id IS NULL",
                $user_id,
                $conversation_id
            )
        );

        $now = current_time('mysql');
        foreach ($ids as $mid) {
            $wpdb->replace(
                $reads,
                array(
                    'message_id' => (int) $mid,
                    'user_id'    => $user_id,
                    'read_at'    => $now,
                ),
                array('%d', '%d', '%s')
            );
        }
    }

    /**
     * @param int $conversation_id
     * @return bool
     */
    public static function current_user_can_access($conversation_id)
    {
        global $wpdb;
        $user = wp_get_current_user();
        if (!Terranima_Auth::user_can_access($user)) {
            return false;
        }
        $table = Terranima_DB::table_conversations();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $conversation_id), ARRAY_A);
        if (!$row) {
            return false;
        }

        $tipo = Terranima_Auth::get_tipo($user);
        if ((string) $row['ambito'] === 'equipo') {
            if ($tipo !== Terranima_Roles::TIPO_PROFESIONAL) {
                return false;
            }
            $me = (int) $user->ID;
            $creator = isset($row['profesional_user_id']) ? (int) $row['profesional_user_id'] : 0;
            $peer = isset($row['peer_user_id']) ? (int) $row['peer_user_id'] : 0;
            if ($peer <= 0) {
                return true;
            }
            return $me === $creator || $me === $peer;
        }

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            return $esp !== '' && $esp === (string) $row['especialidad'];
        }

        return (int) $row['familia_user_id'] === (int) $user->ID;
    }

    /**
     * Familias disponibles para abrir chat (profesionales).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function list_familias()
    {
        $users = get_users(
            array(
                'role'   => Terranima_Roles::ROLE_FAMILIA,
                'number' => 100,
                'orderby'=> 'display_name',
                'order'  => 'ASC',
            )
        );

        $equipo = self::list_profesionales();
        $out = array();
        foreach ($users as $u) {
            $out[] = array(
                'id'        => (int) $u->ID,
                'nombre'    => (string) get_user_meta($u->ID, Terranima_Roles::META_NOMBRE_FAMILIA, true) ?: Terranima_Auth::get_display_name($u),
                'tutor'     => Terranima_Auth::get_display_name($u),
                'email'     => $u->user_email,
                'direccion' => (string) get_user_meta($u->ID, Terranima_Roles::META_DIRECCION, true),
                'numeroSocio' => (string) get_user_meta($u->ID, Terranima_Roles::META_NUMERO_SOCIO, true),
                'animales'  => self::animales_ficha_for_familia((int) $u->ID, $u->user_email),
                'equipo'    => $equipo,
            );
        }
        return $out;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function list_profesionales()
    {
        $users = get_users(
            array(
                'role'    => Terranima_Roles::ROLE_PROFESIONAL,
                'number'  => 50,
                'orderby' => 'display_name',
                'order'   => 'ASC',
            )
        );

        $out = array();
        foreach ($users as $u) {
            $slug = (string) get_user_meta($u->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            $out[] = array(
                'id'               => (int) $u->ID,
                'nombre'           => Terranima_Auth::get_display_name($u),
                'especialidad'     => Terranima_Auth::especialidad_label($slug) ?: $slug,
                'especialidadSlug' => $slug,
            );
        }
        return $out;
    }

    /**
     * Ficha de animales del caso (demo hasta que exista REST de animales).
     *
     * @param int    $user_id
     * @param string $email
     * @return array<int, array<string, mixed>>
     */
    public static function animales_ficha_for_familia($user_id, $email = '')
    {
        unset($user_id);
        $email = strtolower((string) $email);

        if (strpos($email, 'carlos') !== false) {
            return array(
                array(
                    'id'               => 'nala',
                    'nombre'           => 'Nala',
                    'especie'          => 'Perro',
                    'raza'             => 'Mestiza',
                    'sexo'             => 'hembra',
                    'edad'             => 3,
                    'fechaNacimiento'  => '2023-04-12',
                    'color'            => 'Canela',
                    'peso'             => '18 kg',
                    'microchip'        => '941000044112233',
                    'notasProfesional' => 'Trabajo de socialización en paseos urbanos.',
                    'notasTutor'       => 'Muy sociable. Tira un poco de la correa al ver otros perros.',
                ),
            );
        }

        return array(
            array(
                'id'               => 'luna',
                'nombre'           => 'Luna',
                'especie'          => 'Gato',
                'raza'             => 'Europea común',
                'sexo'             => 'hembra',
                'edad'             => 4,
                'fechaNacimiento'  => '2022-03-15',
                'color'            => 'Atigrada gris',
                'peso'             => '4,2 kg',
                'microchip'        => '941000024871562',
                'notasProfesional' => 'Alergia leve a ciertos piensos con cereales. Dieta hipoalergénica recomendada.',
                'notasTutor'       => 'Prefiere comida húmeda por la mañana. Evita el contacto con otros gatos en el patio.',
            ),
            array(
                'id'               => 'rocky',
                'nombre'           => 'Rocky',
                'especie'          => 'Perro',
                'raza'             => 'Labrador Retriever',
                'sexo'             => 'macho',
                'edad'             => 2,
                'fechaNacimiento'  => '2024-05-08',
                'color'            => 'Dorado',
                'peso'             => '28,5 kg',
                'microchip'        => '941000031245789',
                'notasProfesional' => 'En seguimiento por episodio de gastroenteritis julio 2026. Evolución favorable.',
                'notasTutor'       => 'Muy activo; necesita paseos largos. Se pone nervioso con truenos.',
            ),
        );
    }
}
