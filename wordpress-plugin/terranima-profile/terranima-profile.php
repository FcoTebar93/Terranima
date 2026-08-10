<?php
/**
 * Plugin Name: Terranima Profile
 * Description: Área de familias Terrànima (perfil, citas, documentos y chats) en /profile.
 * Version: 1.0.0
 * Author: Terrànima
 * Text Domain: terranima-profile
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TERRANIMA_PROFILE_VERSION', '1.0.0');
define('TERRANIMA_PROFILE_FILE', __FILE__);
define('TERRANIMA_PROFILE_DIR', plugin_dir_path(__FILE__));
define('TERRANIMA_PROFILE_URL', plugin_dir_url(__FILE__));

function terranima_profile_rewrite_rules()
{
    add_rewrite_rule('^profile/?$', 'index.php?terranima_profile=1', 'top');
    add_rewrite_rule('^profile/(.+)/?$', 'index.php?terranima_profile=1', 'top');
}
add_action('init', 'terranima_profile_rewrite_rules');

function terranima_profile_query_vars($vars)
{
    $vars[] = 'terranima_profile';
    return $vars;
}
add_filter('query_vars', 'terranima_profile_query_vars');

function terranima_profile_activate()
{
    terranima_profile_rewrite_rules();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'terranima_profile_activate');

function terranima_profile_deactivate()
{
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'terranima_profile_deactivate');

function terranima_profile_is_request()
{
    if ((int) get_query_var('terranima_profile') === 1) {
        return true;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '';
    if (!is_string($path)) {
        return false;
    }

    $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
    if (is_string($home_path) && $home_path !== '/' && strpos($path, $home_path) === 0) {
        $path = substr($path, strlen(rtrim($home_path, '/'))) ?: '/';
    }

    return (bool) preg_match('#^/profile(/|$)#', $path);
}

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
add_action('plugins_loaded', 'terranima_profile_bypass_maintenance', 1);

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
        '#(src|href)="/wp-content/plugins/terranima-profile/dist/#',
        '$1="' . $asset_base,
        $html
    );

    status_header(200);
    nocache_headers();
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}
add_action('template_redirect', 'terranima_profile_render', 0);

function terranima_profile_render_early()
{
    if (!terranima_profile_is_request()) {
        return;
    }
    terranima_profile_render();
}
add_action('wp', 'terranima_profile_render_early', 1);
