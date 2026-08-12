<?php
/**
 * Roles y capabilities de Terranima.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Roles
{
    public const ROLE_FAMILIA = 'terranima_familia';
    public const ROLE_PROFESIONAL = 'terranima_profesional';

    public const CAP_ACCESS = 'terranima_access';
    public const CAP_FAMILIA = 'terranima_familia';
    public const CAP_PROFESIONAL = 'terranima_profesional';
    public const CAP_MANAGE_ANIMALES = 'terranima_manage_animales';
    public const CAP_MANAGE_CITAS = 'terranima_manage_citas';
    public const CAP_MANAGE_DOCS = 'terranima_manage_documentos';
    public const CAP_MANAGE_CHAT = 'terranima_manage_chat';
    public const CAP_MANAGE_PLANES = 'terranima_manage_planes';

    /**
     * Meta keys de perfil (user_meta).
     */
    public const META_TIPO = 'terranima_tipo';
    public const META_NUMERO_SOCIO = 'terranima_numero_socio';
    public const META_DIRECCION = 'terranima_direccion';
    public const META_ESPECIALIDAD = 'terranima_especialidad';
    public const META_NOMBRE_FAMILIA = 'terranima_nombre_familia';
    public const META_ACTIVO = 'terranima_activo';

    /** tipo: 1 = familia, 2 = profesional */
    public const TIPO_FAMILIA = 1;
    public const TIPO_PROFESIONAL = 2;

    /**
     * @return array<string, string>
     */
    public static function especialidades()
    {
        return array(
            'educacion_canina' => 'Educación canina',
            'nutricion'        => 'Nutrición',
            'terapia_familiar' => 'Terapia familiar',
        );
    }

    /**
     * @return string[]
     */
    public static function caps_compartidas()
    {
        return array(
            self::CAP_ACCESS,
            self::CAP_MANAGE_ANIMALES,
            self::CAP_MANAGE_CITAS,
            self::CAP_MANAGE_DOCS,
            self::CAP_MANAGE_CHAT,
            self::CAP_MANAGE_PLANES,
            'read',
        );
    }

    public static function register()
    {
        $caps_familia = array_fill_keys(self::caps_compartidas(), true);
        $caps_familia[self::CAP_FAMILIA] = true;

        $caps_profesional = array_fill_keys(self::caps_compartidas(), true);
        $caps_profesional[self::CAP_PROFESIONAL] = true;

        add_role(
            self::ROLE_FAMILIA,
            __('Terranima Familia', 'terranima-profile'),
            $caps_familia
        );

        add_role(
            self::ROLE_PROFESIONAL,
            __('Terranima Profesional', 'terranima-profile'),
            $caps_profesional
        );

        // Por si los roles ya existían: asegurar capabilities.
        $familia = get_role(self::ROLE_FAMILIA);
        if ($familia) {
            foreach ($caps_familia as $cap => $grant) {
                $familia->add_cap($cap);
            }
        }

        $profesional = get_role(self::ROLE_PROFESIONAL);
        if ($profesional) {
            foreach ($caps_profesional as $cap => $grant) {
                $profesional->add_cap($cap);
            }
        }

        $admin = get_role('administrator');
        if ($admin) {
            foreach (array_merge(self::caps_compartidas(), array(self::CAP_FAMILIA, self::CAP_PROFESIONAL)) as $cap) {
                $admin->add_cap($cap);
            }
        }
    }

    public static function unregister()
    {
        remove_role(self::ROLE_FAMILIA);
        remove_role(self::ROLE_PROFESIONAL);

        $admin = get_role('administrator');
        if (!$admin) {
            return;
        }

        foreach (array_merge(self::caps_compartidas(), array(self::CAP_FAMILIA, self::CAP_PROFESIONAL)) as $cap) {
            if ($cap === 'read') {
                continue;
            }
            $admin->remove_cap($cap);
        }
    }
}
