<?php
/**
 * Custom Post Types de Terranima.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_CPTs
{
    public const ANIMAL = 'terranima_animal';
    public const CITA = 'terranima_cita';
    public const PLAN = 'terranima_plan';

    public static function register()
    {
        self::register_animal();
        self::register_cita();
        self::register_plan();
    }

    private static function register_animal()
    {
        register_post_type(
            self::ANIMAL,
            array(
                'labels' => array(
                    'name'          => __('Animales', 'terranima-profile'),
                    'singular_name' => __('Animal', 'terranima-profile'),
                    'add_new_item'  => __('Añadir animal', 'terranima-profile'),
                    'edit_item'     => __('Editar animal', 'terranima-profile'),
                    'search_items'  => __('Buscar animales', 'terranima-profile'),
                    'not_found'     => __('No se encontraron animales', 'terranima-profile'),
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'terranima',
                'show_in_rest'        => false,
                'exclude_from_search' => true,
                'publicly_queryable'  => false,
                'has_archive'         => false,
                'hierarchical'        => false,
                'supports'            => array('title', 'thumbnail', 'author'),
                'capability_type'     => 'post',
                'map_meta_cap'        => true,
                'menu_icon'           => 'dashicons-pets',
            )
        );
    }

    private static function register_cita()
    {
        register_post_type(
            self::CITA,
            array(
                'labels' => array(
                    'name'          => __('Citas', 'terranima-profile'),
                    'singular_name' => __('Cita', 'terranima-profile'),
                    'add_new_item'  => __('Añadir cita', 'terranima-profile'),
                    'edit_item'     => __('Editar cita', 'terranima-profile'),
                    'search_items'  => __('Buscar citas', 'terranima-profile'),
                    'not_found'     => __('No se encontraron citas', 'terranima-profile'),
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'terranima',
                'show_in_rest'        => false,
                'exclude_from_search' => true,
                'publicly_queryable'  => false,
                'has_archive'         => false,
                'hierarchical'        => false,
                'supports'            => array('title', 'editor', 'author'),
                'capability_type'     => 'post',
                'map_meta_cap'        => true,
            )
        );
    }

    private static function register_plan()
    {
        register_post_type(
            self::PLAN,
            array(
                'labels' => array(
                    'name'          => __('Planes y bonos', 'terranima-profile'),
                    'singular_name' => __('Plan / bono', 'terranima-profile'),
                    'add_new_item'  => __('Añadir plan o bono', 'terranima-profile'),
                    'edit_item'     => __('Editar plan o bono', 'terranima-profile'),
                    'search_items'  => __('Buscar planes', 'terranima-profile'),
                    'not_found'     => __('No se encontraron planes', 'terranima-profile'),
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'terranima',
                'show_in_rest'        => false,
                'exclude_from_search' => true,
                'publicly_queryable'  => false,
                'has_archive'         => false,
                'hierarchical'        => false,
                'supports'            => array('title', 'editor', 'author'),
                'capability_type'     => 'post',
                'map_meta_cap'        => true,
            )
        );
    }

    /**
     * Menú admin padre para agrupar CPTs.
     */
    public static function register_admin_menu()
    {
        add_menu_page(
            __('Terranima', 'terranima-profile'),
            __('Terranima', 'terranima-profile'),
            Terranima_Roles::CAP_ACCESS,
            'terranima',
            '__return_null',
            'dashicons-heart',
            26
        );
    }

    /**
     * Evita el ítem vacío duplicado del menú padre.
     */
    public static function cleanup_admin_menu()
    {
        remove_submenu_page('terranima', 'terranima');
    }

    /**
     * Claves de post meta usadas por cada CPT (referencia del modelo).
     *
     * @return array<string, string[]>
     */
    public static function meta_keys()
    {
        return array(
            self::ANIMAL => array(
                'especie',
                'raza',
                'sexo',
                'fecha_nacimiento',
                'color',
                'peso',
                'microchip',
                'notas_profesional',
                'notas_tutor',
            ),
            self::CITA => array(
                'fecha',
                'hora',
                'estado',
                'especialidad',
                'familia_user_id',
                'profesional_user_id',
                'animal_id',
                'solo_profesional',
                'creado_por',
                'plan_id',
            ),
            self::PLAN => array(
                'tipo',
                'estado',
                'familia_user_id',
                'fecha_inicio',
                'fecha_fin',
                'sesiones_total',
                'sesiones_usadas',
            ),
        );
    }
}
