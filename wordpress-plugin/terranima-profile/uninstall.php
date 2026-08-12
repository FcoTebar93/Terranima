<?php
/**
 * Desinstalación completa del plugin Terranima Profile.
 *
 * @package Terranima_Profile
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

require_once dirname(__FILE__) . '/includes/class-terranima-roles.php';
require_once dirname(__FILE__) . '/includes/class-terranima-db.php';

Terranima_Roles::unregister();
Terranima_DB::drop_tables();

delete_option('terranima_db_version');

// No borramos posts CPT ni user_meta automáticamente para evitar pérdida accidental
// de datos clínicos/familiares. Se pueden limpiar a mano o con una herramienta de migración.
