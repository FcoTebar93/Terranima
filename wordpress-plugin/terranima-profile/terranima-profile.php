<?php
/**
 * Plugin Name: Terranima Profile
 * Description: Área de familias y profesionales Terranima (perfil, citas, documentos y chats) en /profile.
 * Version: 1.4.0
 * Author: Terranima
 * Text Domain: terranima-profile
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('TERRANIMA_PROFILE_VERSION')) {
    define('TERRANIMA_PROFILE_VERSION', '1.4.0');
}
if (!defined('TERRANIMA_PROFILE_FILE')) {
    define('TERRANIMA_PROFILE_FILE', __FILE__);
}
if (!defined('TERRANIMA_PROFILE_DIR')) {
    define('TERRANIMA_PROFILE_DIR', plugin_dir_path(__FILE__));
}
if (!defined('TERRANIMA_PROFILE_URL')) {
    define('TERRANIMA_PROFILE_URL', plugin_dir_url(__FILE__));
}

require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-roles.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-cpts.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-db.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-auth.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-citas.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-documentos.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-chat.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-rest.php';
require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-activator.php';

register_activation_hook(__FILE__, array('Terranima_Activator', 'activate'));
register_deactivation_hook(__FILE__, array('Terranima_Activator', 'deactivate'));

add_action('init', array('Terranima_CPTs', 'register'));
add_action('init', array('Terranima_Roles', 'register'), 4);
add_action('init', array('Terranima_DB', 'maybe_upgrade'), 5);
add_action('init', array('Terranima_Auth', 'register_hooks'));
add_action('admin_menu', array('Terranima_CPTs', 'register_admin_menu'));
add_action('admin_menu', array('Terranima_CPTs', 'cleanup_admin_menu'), 999);
add_action('rest_api_init', array('Terranima_REST', 'register_routes'));

if (!function_exists('terranima_profile_rewrite_rules')) {
    function terranima_profile_rewrite_rules()
    {
        add_rewrite_rule('^profile/?$', 'index.php?terranima_profile=1', 'top');
        add_rewrite_rule('^profile/(.+)/?$', 'index.php?terranima_profile=1', 'top');
    }
}
add_action('init', 'terranima_profile_rewrite_rules');

if (!function_exists('terranima_profile_query_vars')) {
    function terranima_profile_query_vars($vars)
    {
        $vars[] = 'terranima_profile';
        return $vars;
    }
}
add_filter('query_vars', 'terranima_profile_query_vars');

if (!function_exists('terranima_profile_request_path')) {
    function terranima_profile_request_path()
    {
        if (empty($_SERVER['REQUEST_URI'])) {
            return '';
        }

        $path = wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return '';
        }

        $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
        if (is_string($home_path) && $home_path !== '/' && strpos($path, $home_path) === 0) {
            $trimmed = substr($path, strlen(rtrim($home_path, '/')));
            $path = ($trimmed === '' || $trimmed === false) ? '/' : $trimmed;
        }

        return $path;
    }
}

if (!function_exists('terranima_profile_is_request')) {
    /**
     * Detecta /profile solo por la URL. No usa get_query_var() (falla en plugins_loaded).
     */
    function terranima_profile_is_request()
    {
        if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
            return false;
        }

        if (defined('WP_CLI') && WP_CLI) {
            return false;
        }

        if (defined('REST_REQUEST') && REST_REQUEST) {
            return false;
        }

        $path = terranima_profile_request_path();
        if ($path === '') {
            return false;
        }

        if (strpos($path, '/wp-admin') !== false || strpos($path, 'wp-login.php') !== false) {
            return false;
        }

        return (bool) preg_match('#^/profile(/|$)#', $path);
    }
}

if (!function_exists('terranima_profile_bypass_maintenance')) {
    function terranima_profile_bypass_maintenance()
    {
        if (!terranima_profile_is_request()) {
            return;
        }

        add_filter('pre_option_elementor_maintenance_mode_mode', static function () {
            return '';
        });

        add_filter('pre_option_wp_maintenance_mode', '__return_zero');
    }
}
add_action('init', 'terranima_profile_bypass_maintenance', 0);

if (!function_exists('terranima_profile_render')) {
    function terranima_profile_render()
    {
        if (!terranima_profile_is_request()) {
            return;
        }

        $index = TERRANIMA_PROFILE_DIR . 'dist/index.html';
        if (!is_readable($index)) {
            status_header(500);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Terranima Profile: falta dist/index.html. Vuelve a generar el build del plugin.';
            exit;
        }

        $html = file_get_contents($index);
        if ($html === false) {
            status_header(500);
            exit;
        }

        $asset_base = esc_url(TERRANIMA_PROFILE_URL . 'dist/');
        $html = preg_replace(
            '#(src|href)="/wp-content/plugins/terranima-profile(?:-\d+)?/dist/#',
            '$1="' . $asset_base,
            $html
        );

        $config_json = wp_json_encode(Terranima_Auth::frontend_config());
        if (is_string($config_json)) {
            $bootstrap = '<script>window.__TERRANIMA__=' . $config_json . ';</script>';
            if (strpos($html, '</head>') !== false) {
                $html = str_replace('</head>', $bootstrap . '</head>', $html);
            } else {
                $html = $bootstrap . $html;
            }
        }

        status_header(200);
        nocache_headers();
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }
}
add_action('template_redirect', 'terranima_profile_render', 0);

if (!function_exists('terranima_profile_render_early')) {
    function terranima_profile_render_early()
    {
        if (!terranima_profile_is_request()) {
            return;
        }
        terranima_profile_render();
    }
}
add_action('wp', 'terranima_profile_render_early', 1);
