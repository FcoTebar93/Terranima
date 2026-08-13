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
                'permission_callback' => array(__CLASS__, 'permission_logged_in'),
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
                'permission_callback' => array(__CLASS__, 'permission_logged_in'),
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
                    'permission_callback' => array(__CLASS__, 'permission_familia'),
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
    }

    /**
     * @return bool|WP_Error
     */
    public static function permission_logged_in()
    {
        if (!is_user_logged_in()) {
            return new WP_Error('terranima_not_logged_in', __('No has iniciado sesión.', 'terranima-profile'), array('status' => 401));
        }

        return true;
    }

    /**
     * @return bool|WP_Error
     */
    public static function permission_access()
    {
        $logged = self::permission_logged_in();
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
        } else {
            $args['familia_user_id'] = (int) $user->ID;
        }

        return rest_ensure_response(Terranima_Citas::query($args));
    }

    /**
     * Familia solicita una cita → estado pendiente.
     *
     * @return WP_REST_Response|WP_Error
     */
    public static function post_cita(WP_REST_Request $request)
    {
        $id = Terranima_Citas::create(
            array(
                'fecha'            => $request->get_param('fecha'),
                'hora'             => $request->get_param('hora'),
                'tipo'             => $request->get_param('tipo'),
                'especialidad'     => $request->get_param('especialidad') ?: $request->get_param('tipo'),
                'animal'           => $request->get_param('animal'),
                'notas'            => $request->get_param('notas'),
                'familia_user_id'  => get_current_user_id(),
                'estado'           => 'pendiente',
            )
        );

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
        unset($request);

        $user = wp_get_current_user();
        $tipo = Terranima_Auth::get_tipo($user);
        $args = array();

        if ($tipo !== Terranima_Roles::TIPO_PROFESIONAL) {
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

        $id = Terranima_Documentos::create_from_upload(
            $file,
            array(
                'familia_user_id' => $request->get_param('familia_user_id'),
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
                'animal'          => $request->get_param('animal'),
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
}
