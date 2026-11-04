<?php
/**
 * REST API Terranima (/wp-json/terranima/v1).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_REST
{
    public const NAMESPACE = 'terranima/v1';

    public static function register_routes()
    {
        register_rest_route(
            self::NAMESPACE,
            '/me',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_me'),
                'permission_callback' => array(__CLASS__, 'permission_portal'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/login',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'post_login'),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'email' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'password' => array(
                        'required' => true,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/logout',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'post_logout'),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/citas',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array(__CLASS__, 'get_citas'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array(__CLASS__, 'post_cita'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/citas/(?P<id>\d+)',
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array(__CLASS__, 'patch_cita'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
                'args'                => array(
                    'id' => array(
                        'required' => true,
                        'type'     => 'integer',
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/documentos',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array(__CLASS__, 'get_documentos'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array(__CLASS__, 'post_documento'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/documentos/(?P<id>\d+)',
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array(__CLASS__, 'delete_documento'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
                'args'                => array(
                    'id' => array(
                        'required' => true,
                        'type'     => 'integer',
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/chats',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array(__CLASS__, 'get_chats'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array(__CLASS__, 'post_chat'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/chats/(?P<id>\d+)',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_chat'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
                'args'                => array(
                    'id' => array(
                        'required' => true,
                        'type'     => 'integer',
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/chats/(?P<id>\d+)/messages',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array(__CLASS__, 'get_chat_messages'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array(__CLASS__, 'post_chat_message'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/chats/(?P<id>\d+)/read',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'post_chat_read'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/familias',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_familias'),
                'permission_callback' => array(__CLASS__, 'permission_profesional'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/profesionales',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_profesionales'),
                // Familias (urgencias) y profesionales (chat/equipo).
                'permission_callback' => array(__CLASS__, 'permission_access'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/animales',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array(__CLASS__, 'get_animales'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array(__CLASS__, 'post_animal'),
                    'permission_callback' => array(__CLASS__, 'permission_profesional'),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/animales/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array(__CLASS__, 'patch_animal'),
                    'permission_callback' => array(__CLASS__, 'permission_access'),
                    'args'                => array(
                        'id' => array(
                            'required' => true,
                            'type'     => 'integer',
                        ),
                    ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array(__CLASS__, 'delete_animal'),
                    'permission_callback' => array(__CLASS__, 'permission_profesional'),
                    'args'                => array(
                        'id' => array(
                            'required' => true,
                            'type'     => 'integer',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/animales/(?P<id>\d+)/foto',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'post_animal_foto'),
                'permission_callback' => array(__CLASS__, 'permission_profesional'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/planes',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_planes'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/documentos/(?P<id>\d+)/file',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array(__CLASS__, 'get_documento_file'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
                'args'                => array(
                    'id' => array(
                        'required' => true,
                        'type'     => 'integer',
                    ),
                ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/urgencias',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array(__CLASS__, 'post_urgencia'),
                'permission_callback' => array(__CLASS__, 'permission_access'),
                'args'                => array(
                    'profesional_id' => array(
                        'required'          => true,
                        'type'              => 'integer',
                        'sanitize_callback' => 'absint',
                    ),
                    'urgencia' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'cuerpo' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ),
                ),
            )
        );
    }

    /**
     * Sesión del portal (cookie Terranima), independiente de wp-login.
     *
     * @return bool|WP_Error
     */
    public static function permission_portal()
    {
        $user = Terranima_Auth::adopt_portal_user();
        if (!$user) {
            return new WP_Error('terranima_not_logged_in', __('No has iniciado sesión en el área Terranima.', 'terranima-profile'), array('status' => 401));
        }

        if (!Terranima_Auth::user_can_access($user)) {
            return new WP_Error('terranima_forbidden', __('Tu cuenta no tiene acceso al área Terranima.', 'terranima-profile'), array('status' => 403));
        }

        return true;
    }

    /**
     * @return bool|WP_Error
     */
    public static function permission_logged_in()
    {
        return self::permission_portal();
    }

    /**
     * @return bool|WP_Error
     */
    public static function permission_access()
    {
        $logged = self::permission_portal();
        if (is_wp_error($logged)) {
            return $logged;
        }

        if (!Terranima_Auth::user_can_access()) {
            return new WP_Error('terranima_forbidden', __('Tu cuenta no tiene acceso al área Terranima.', 'terranima-profile'), array('status' => 403));
        }

        return true;
    }

    /**
     * Solo familias (tipo 1) pueden solicitar citas.
     *
     * @return bool|WP_Error
     */
    public static function permission_familia()
    {
        $access = self::permission_access();
        if (is_wp_error($access)) {
            return $access;
        }

        if (Terranima_Auth::get_tipo() !== Terranima_Roles::TIPO_FAMILIA) {
            return new WP_Error('terranima_forbidden', __('Solo las familias pueden solicitar citas.', 'terranima-profile'), array('status' => 403));
        }

        return true;
    }

    /**
     * @return bool|WP_Error
     */
    public static function permission_profesional()
    {
        $access = self::permission_access();
        if (is_wp_error($access)) {
            return $access;
        }

        if (Terranima_Auth::get_tipo() !== Terranima_Roles::TIPO_PROFESIONAL) {
            return new WP_Error('terranima_forbidden', __('Solo profesionales.', 'terranima-profile'), array('status' => 403));
        }

        return true;
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_me(WP_REST_Request $request)
    {
        unset($request);

        $payload = Terranima_Auth::serialize_user();
        if (is_wp_error($payload)) {
            return $payload;
        }

        return rest_ensure_response($payload);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_login(WP_REST_Request $request)
    {
        $email = (string) $request->get_param('email');
        $password = (string) $request->get_param('password');

        $user = Terranima_Auth::authenticate($email, $password);
        if (is_wp_error($user)) {
            return $user;
        }

        wp_set_current_user($user->ID);

        $payload = Terranima_Auth::serialize_user($user);
        if (is_wp_error($payload)) {
            return $payload;
        }

        $payload['nonce'] = wp_create_nonce('wp_rest');

        return rest_ensure_response($payload);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_logout(WP_REST_Request $request)
    {
        unset($request);

        Terranima_Auth::logout();

        return rest_ensure_response(
            array(
                'success' => true,
            )
        );
    }

    /**
     * Lista citas del usuario actual (familia propias / profesional por especialidad).
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function get_citas(WP_REST_Request $request)
    {
        unset($request);

        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $args = array();

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
            if ($esp === '') {
                return rest_ensure_response(array());
            }
            $args['especialidad'] = $esp;
            $args['familia_user_ids'] = Terranima_Asignaciones::familia_ids_for_profesional($user);
        } else {
            $args['familia_user_id'] = (int) $user->ID;
        }

        return rest_ensure_response(Terranima_Citas::query($args));
    }

    /**
     * Familia solicita (pendiente) o profesional programa (confirmada).
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function post_cita(WP_REST_Request $request)
    {
        $tipo_usuario = Terranima_Auth::get_tipo();

        if ($tipo_usuario === Terranima_Roles::TIPO_PROFESIONAL) {
            $familia_id = (int) $request->get_param('familia_user_id');
            if ($familia_id <= 0) {
                return new WP_Error(
                    'terranima_cita_familia',
                    __('Selecciona la familia para programar la cita.', 'terranima-profile'),
                    array('status' => 400)
                );
            }
            if (!Terranima_Documentos::profesional_can_access_familia($familia_id)) {
                return new WP_Error(
                    'terranima_cita_not_assigned',
                    __('Solo puedes programar citas para familias asignadas a ti.', 'terranima-profile'),
                    array('status' => 403)
                );
            }

            $esp = (string) get_user_meta(get_current_user_id(), Terranima_Roles::META_ESPECIALIDAD, true);
            $label = Terranima_Citas::especialidad_label($esp);
            $tipo_cita = $request->get_param('tipo') ?: $label;
            $tipos_solo = array('Grupo de desarrollo', 'Dog café');
            $solo = in_array($tipo_cita, $tipos_solo, true)
                || (bool) $request->get_param('solo_profesional')
                || (bool) $request->get_param('soloProfesional');
            $id = Terranima_Citas::create(
                array(
                    'fecha'            => $request->get_param('fecha'),
                    'hora'             => $request->get_param('hora'),
                    'tipo'             => $tipo_cita,
                    'especialidad'     => $esp,
                    'animal'           => $request->get_param('animal'),
                    'notas'            => $request->get_param('notas'),
                    'familia_user_id'  => $familia_id,
                    'estado'           => 'confirmada',
                    'solo_profesional' => $solo,
                )
            );
        } else {
            $id = Terranima_Citas::create(
                array(
                    'fecha'           => $request->get_param('fecha'),
                    'hora'            => $request->get_param('hora'),
                    'tipo'            => $request->get_param('tipo'),
                    'especialidad'    => $request->get_param('especialidad') ?: $request->get_param('tipo'),
                    'animal'          => $request->get_param('animal'),
                    'notas'           => $request->get_param('notas'),
                    'familia_user_id' => get_current_user_id(),
                    'estado'          => 'pendiente',
                )
            );
        }

        if (is_wp_error($id)) {
            return $id;
        }

        $item = Terranima_Citas::serialize($id);
        return rest_ensure_response($item);
    }

    /**
     * Profesional acepta/rechaza (o familia cancela si es suya).
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function patch_cita(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $estado = (string) $request->get_param('estado');

        if (!Terranima_Citas::current_user_can_manage($id)) {
            return new WP_Error('terranima_forbidden', __('No puedes modificar esta cita.', 'terranima-profile'), array('status' => 403));
        }

        $tipo = Terranima_Auth::get_tipo();
        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            if (!in_array($estado, array('confirmada', 'rechazada', 'completada'), true)) {
                return new WP_Error('terranima_cita_bad_estado', __('Estado no permitido.', 'terranima-profile'), array('status' => 400));
            }
        } elseif ($estado !== 'cancelada') {
            return new WP_Error('terranima_cita_bad_estado', __('Solo puedes cancelar tus citas.', 'terranima-profile'), array('status' => 400));
        }

        $result = Terranima_Citas::set_estado($id, $estado);
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(Terranima_Citas::serialize($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_documentos(WP_REST_Request $request)
    {
        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $args = array();
        $filter_familia = (int) $request->get_param('familia_user_id');

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            if ($filter_familia > 0) {
                if (!Terranima_Documentos::profesional_can_access_familia($filter_familia, $user)) {
                    return new WP_Error(
                        'terranima_doc_not_assigned',
                        __('No tienes acceso a los documentos de esa familia.', 'terranima-profile'),
                        array('status' => 403)
                    );
                }
                $args['familia_user_id'] = $filter_familia;
            }
        } else {
            $args['familia_user_id'] = (int) $user->ID;
        }

        $items = Terranima_Documentos::query($args);
        $out = array();
        foreach ($items as $item) {
            if (Terranima_Documentos::current_user_can_view((int) $item['id'])) {
                $out[] = $item;
            }
        }

        return rest_ensure_response($out);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_documento(WP_REST_Request $request)
    {
        $files = $request->get_file_params();
        $file = isset($files['file']) ? $files['file'] : null;

        $tipo = Terranima_Auth::get_tipo();
        $familia_id = (int) $request->get_param('familia_user_id');
        if ($tipo !== Terranima_Roles::TIPO_PROFESIONAL) {
            $familia_id = (int) get_current_user_id();
        } elseif ($familia_id <= 0) {
            return new WP_Error(
                'terranima_doc_familia',
                __('Selecciona la familia a la que subir el archivo.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        $id = Terranima_Documentos::create_from_upload(
            $file,
            array(
                'familia_user_id' => $familia_id,
                'animal'          => $request->get_param('animal'),
                'categoria'       => $request->get_param('categoria'),
            )
        );

        if (is_wp_error($id)) {
            return $id;
        }

        return rest_ensure_response(Terranima_Documentos::serialize($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function delete_documento(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $result = Terranima_Documentos::delete($id);
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(array('success' => true));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_chats(WP_REST_Request $request)
    {
        unset($request);
        return rest_ensure_response(Terranima_Chat::list_for_current_user());
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_chat(WP_REST_Request $request)
    {
        $id = Terranima_Chat::create_conversation(
            array(
                'familia_user_id' => $request->get_param('familia_user_id'),
                'especialidad'    => $request->get_param('especialidad'),
                'ambito'          => $request->get_param('ambito'),
                'kind'            => $request->get_param('kind'),
                'animal'          => $request->get_param('animal'),
                'peer_user_id'    => $request->get_param('peer_user_id'),
            )
        );

        if (is_wp_error($id)) {
            return $id;
        }

        $item = Terranima_Chat::serialize_conversation($id, true);
        return rest_ensure_response($item);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_chat(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        if (!Terranima_Chat::current_user_can_access($id)) {
            return new WP_Error('terranima_forbidden', __('No puedes ver este chat.', 'terranima-profile'), array('status' => 403));
        }

        $item = Terranima_Chat::serialize_conversation($id, true);
        if (!$item) {
            return new WP_Error('terranima_not_found', __('Chat no encontrado.', 'terranima-profile'), array('status' => 404));
        }

        return rest_ensure_response($item);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_chat_messages(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        if (!Terranima_Chat::current_user_can_access($id)) {
            return new WP_Error('terranima_forbidden', __('No puedes ver este chat.', 'terranima-profile'), array('status' => 403));
        }

        return rest_ensure_response(Terranima_Chat::list_messages($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_chat_message(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $msg = Terranima_Chat::send_message($id, (string) $request->get_param('texto'));
        if (is_wp_error($msg)) {
            return $msg;
        }

        return rest_ensure_response($msg);
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_chat_read(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        if (!Terranima_Chat::current_user_can_access($id)) {
            return new WP_Error('terranima_forbidden', __('No puedes ver este chat.', 'terranima-profile'), array('status' => 403));
        }

        Terranima_Chat::mark_read($id);
        return rest_ensure_response(array('success' => true));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_familias(WP_REST_Request $request)
    {
        unset($request);
        return rest_ensure_response(Terranima_Chat::list_familias());
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_profesionales(WP_REST_Request $request)
    {
        unset($request);
        $user = wp_get_current_user();
        $me = (int) $user->ID;
        $tipo = Terranima_Auth::get_tipo($user);

        // Familias (urgencias): solo su educador + nutricionista asignados.
        if ($tipo === Terranima_Roles::TIPO_FAMILIA) {
            Terranima_Asignaciones::ensure_for_familia($me, true);
            return rest_ensure_response(Terranima_Asignaciones::get_equipo($me));
        }

        // Profesionales (chat interno): resto del equipo.
        $out = array();
        foreach (Terranima_Chat::list_profesionales() as $p) {
            if ((int) $p['id'] === $me) {
                continue;
            }
            $out[] = $p;
        }
        return rest_ensure_response($out);
    }

    /**
     * Fichas de la familia de la sesión (tutor).
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function get_animales(WP_REST_Request $request)
    {
        unset($request);
        if (Terranima_Auth::get_tipo() !== Terranima_Roles::TIPO_FAMILIA) {
            return new WP_Error('terranima_forbidden', __('Solo las familias consultan su expediente de animales aquí.', 'terranima-profile'), array('status' => 403));
        }

        return rest_ensure_response(Terranima_Animales::query_for_familia((int) get_current_user_id()));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_animal(WP_REST_Request $request)
    {
        $id = Terranima_Animales::create($request->get_params());
        if (is_wp_error($id)) {
            return $id;
        }

        return rest_ensure_response(Terranima_Animales::serialize($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function patch_animal(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $result = Terranima_Animales::update($id, $request->get_params());
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(Terranima_Animales::serialize($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function delete_animal(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $result = Terranima_Animales::delete($id);
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(array('success' => true));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function post_animal_foto(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        $files = $request->get_file_params();
        $file = isset($files['file']) ? $files['file'] : null;
        $result = Terranima_Animales::set_foto($id, $file);
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(Terranima_Animales::serialize($id));
    }

    /**
     * @return WP_REST_Response|WP_Error
     */
    public static function get_planes(WP_REST_Request $request)
    {
        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $familia_id = (int) $request->get_param('familia_user_id');

        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            if ($familia_id <= 0) {
                return new WP_Error(
                    'terranima_plan_familia',
                    __('Indica la familia para consultar su plan.', 'terranima-profile'),
                    array('status' => 400)
                );
            }
            if (!Terranima_Documentos::profesional_can_access_familia($familia_id, $user)) {
                return new WP_Error('terranima_forbidden', __('No tienes acceso a esa familia.', 'terranima-profile'), array('status' => 403));
            }
        } else {
            $familia_id = (int) $user->ID;
        }

        $plan_id = Terranima_Planes::ensure_for_familia($familia_id);
        if (is_wp_error($plan_id)) {
            return $plan_id;
        }

        return rest_ensure_response(Terranima_Planes::query_for_familia($familia_id));
    }

    /**
     * Sirve el archivo solo si el usuario puede ver el documento.
     *
     * @return WP_REST_Response|WP_Error|void
     */
    public static function get_documento_file(WP_REST_Request $request)
    {
        $id = (int) $request->get_param('id');
        return Terranima_Documentos::stream_file($id);
    }

    /**
     * Resuelve el email registrado del profesional (destino del aviso).
     *
     * @param int $profesional_id
     * @return array{user: WP_User, email: string}|WP_Error
     */
    public static function resolver_profesional($profesional_id)
    {
        $profesional_id = (int) $profesional_id;
        if ($profesional_id <= 0) {
            return new WP_Error(
                'terranima_profesional_required',
                __('Elige un profesional.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        $profesional = get_userdata($profesional_id);
        if (!$profesional instanceof WP_User) {
            return new WP_Error(
                'terranima_profesional_not_found',
                __('No se ha encontrado ese profesional.', 'terranima-profile'),
                array('status' => 404)
            );
        }

        $roles_ok = array_intersect(
            Terranima_Roles::roles_profesional(),
            (array) $profesional->roles
        );
        if (!$roles_ok) {
            return new WP_Error(
                'terranima_profesional_invalid',
                __('El destinatario no es un profesional Terranima.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        if (!Terranima_Auth::user_can_access($profesional)) {
            return new WP_Error(
                'terranima_profesional_inactive',
                __('Ese profesional no está disponible.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        if (!is_email($profesional->user_email)) {
            return new WP_Error(
                'terranima_profesional_no_email',
                __('Ese profesional no tiene un email válido registrado.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        $email = apply_filters('terranima_urgencias_destino', $profesional->user_email, $profesional);
        if (!is_string($email) || !is_email($email)) {
            $email = $profesional->user_email;
        }

        return array(
            'user'  => $profesional,
            'email' => $email,
        );
    }

    /**
     * Envía un aviso de urgencia al email registrado del profesional elegido (vía wp_mail / WP Mail SMTP).
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function post_urgencia(WP_REST_Request $request)
    {
        $urgencia = trim((string) $request->get_param('urgencia'));
        $cuerpo = trim((string) $request->get_param('cuerpo'));
        $profesional_id = (int) $request->get_param('profesional_id');

        if ($urgencia === '') {
            return new WP_Error(
                'terranima_urgencia_tipo_empty',
                __('Indica el tipo de urgencia.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        if (strlen($urgencia) > 120) {
            return new WP_Error(
                'terranima_urgencia_tipo_long',
                __('El tipo de urgencia es demasiado largo.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        if ($cuerpo === '') {
            return new WP_Error(
                'terranima_urgencia_empty',
                __('Describe la urgencia antes de enviarla.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        if (strlen($cuerpo) > 5000) {
            return new WP_Error(
                'terranima_urgencia_body_long',
                __('La descripción es demasiado larga.', 'terranima-profile'),
                array('status' => 400)
            );
        }

        $destino = self::resolver_profesional($profesional_id);
        if (is_wp_error($destino)) {
            return $destino;
        }

        $user = wp_get_current_user();
        if (Terranima_Auth::get_tipo($user) === Terranima_Roles::TIPO_FAMILIA
            && !Terranima_Asignaciones::profesional_is_assigned_to_familia($profesional_id, (int) $user->ID)
        ) {
            return new WP_Error(
                'terranima_urgencia_not_assigned',
                __('Solo puedes avisar a los profesionales asignados a tu familia.', 'terranima-profile'),
                array('status' => 403)
            );
        }

        $nombre = Terranima_Auth::get_display_name($user);
        $to = $destino['email'];

        $subject = sprintf('URGENCIA: %s tiene una urgencia por %s', $nombre, $urgencia);
        $body = sprintf(
            "%s nos expresa la siguiente urgencia:\n\n%s",
            $nombre,
            $cuerpo
        );

        $headers = array('Content-Type: text/plain; charset=UTF-8');
        if (!empty($user->user_email) && is_email($user->user_email)) {
            $headers[] = 'Reply-To: ' . $user->user_email;
        }

        $mail_error = null;
        $on_failed = static function ($error) use (&$mail_error) {
            $mail_error = $error;
        };
        add_action('wp_mail_failed', $on_failed);

        $sent = wp_mail($to, $subject, $body, $headers);

        remove_action('wp_mail_failed', $on_failed);

        if (!$sent) {
            $detail = '';
            if ($mail_error instanceof WP_Error) {
                $detail = ' ' . $mail_error->get_error_message();
            }

            return new WP_Error(
                'terranima_mail_failed',
                __('No se pudo enviar el aviso.', 'terranima-profile') . $detail,
                array('status' => 500)
            );
        }

        return rest_ensure_response(
            array(
                'success'   => true,
                'delivered' => true,
            )
        );
    }
}
