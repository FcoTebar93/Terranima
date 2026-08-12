<?php
/**
 * Activación / desactivación del plugin.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Activator
{
    public static function activate()
    {
        require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-roles.php';
        require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-cpts.php';
        require_once TERRANIMA_PROFILE_DIR . 'includes/class-terranima-db.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        Terranima_Roles::register();
        Terranima_CPTs::register();
        Terranima_DB::install();

        if (get_option('permalink_structure') === '') {
            update_option('permalink_structure', '/%postname%/');
        }

        if (function_exists('terranima_profile_rewrite_rules')) {
            terranima_profile_rewrite_rules();
        }

        flush_rewrite_rules(true);
        if (function_exists('save_mod_rewrite_rules')) {
            save_mod_rewrite_rules();
        }

        self::ensure_htaccess_rewrite_rules();
    }

    /**
     * En Docker/CLI save_mod_rewrite_rules() a veces deja .htaccess vacío.
     */
    private static function ensure_htaccess_rewrite_rules()
    {
        $htaccess = ABSPATH . '.htaccess';
        if (!is_writable($htaccess) && !file_exists($htaccess)) {
            return;
        }

        $contents = is_readable($htaccess) ? file_get_contents($htaccess) : '';
        if (is_string($contents) && strpos($contents, 'RewriteEngine On') !== false) {
            return;
        }

        $rules = array(
            '<IfModule mod_rewrite.c>',
            'RewriteEngine On',
            'RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]',
            'RewriteBase /',
            'RewriteRule ^index\\.php$ - [L]',
            'RewriteCond %{REQUEST_FILENAME} !-f',
            'RewriteCond %{REQUEST_FILENAME} !-d',
            'RewriteRule . /index.php [L]',
            '</IfModule>',
        );

        insert_with_markers($htaccess, 'WordPress', $rules);
    }

    public static function deactivate()
    {
        flush_rewrite_rules(false);
        // Roles, CPTs data y tablas se conservan al desactivar.
    }
}
