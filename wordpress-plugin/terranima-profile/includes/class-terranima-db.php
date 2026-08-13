<?php
/**
 * Tablas personalizadas (chat) y versionado de esquema.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_DB
{
    public const DB_VERSION = '1.1.0';
    public const OPTION_DB_VERSION = 'terranima_db_version';

    public static function table_conversations()
    {
        global $wpdb;
        return $wpdb->prefix . 'terranima_conversations';
    }

    public static function table_messages()
    {
        global $wpdb;
        return $wpdb->prefix . 'terranima_messages';
    }

    public static function table_message_reads()
    {
        global $wpdb;
        return $wpdb->prefix . 'terranima_message_reads';
    }

    public static function maybe_upgrade()
    {
        $installed = get_option(self::OPTION_DB_VERSION, '');
        if ($installed === self::DB_VERSION) {
            return;
        }

        self::install();
    }

    public static function install()
    {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();
        $conversations = self::table_conversations();
        $messages = self::table_messages();
        $reads = self::table_message_reads();

        $sql_conversations = "CREATE TABLE {$conversations} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            familia_user_id bigint(20) unsigned NOT NULL,
            profesional_user_id bigint(20) unsigned DEFAULT NULL,
            especialidad varchar(64) NOT NULL,
            ambito varchar(16) NOT NULL,
            animal_id bigint(20) unsigned DEFAULT NULL,
            animal_nombre varchar(128) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY familia_user_id (familia_user_id),
            KEY profesional_user_id (profesional_user_id),
            KEY especialidad (especialidad),
            KEY animal_id (animal_id),
            KEY animal_nombre (animal_nombre),
            KEY updated_at (updated_at)
        ) {$charset};";

        $sql_messages = "CREATE TABLE {$messages} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            conversation_id bigint(20) unsigned NOT NULL,
            sender_user_id bigint(20) unsigned NOT NULL,
            body text NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY conversation_id (conversation_id),
            KEY sender_user_id (sender_user_id),
            KEY created_at (created_at)
        ) {$charset};";

        $sql_reads = "CREATE TABLE {$reads} (
            message_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            read_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (message_id, user_id),
            KEY user_id (user_id)
        ) {$charset};";

        dbDelta($sql_conversations);
        dbDelta($sql_messages);
        dbDelta($sql_reads);

        update_option(self::OPTION_DB_VERSION, self::DB_VERSION);
    }

    public static function drop_tables()
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query('DROP TABLE IF EXISTS ' . self::table_message_reads());
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query('DROP TABLE IF EXISTS ' . self::table_messages());
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query('DROP TABLE IF EXISTS ' . self::table_conversations());

        delete_option(self::OPTION_DB_VERSION);
    }
}
