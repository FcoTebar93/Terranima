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
}
