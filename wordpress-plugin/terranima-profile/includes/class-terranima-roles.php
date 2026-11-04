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
    public const ROLE_EDUCADOR = 'terranima_educador';
    public const ROLE_NUTRICIONISTA = 'terranima_nutricionista';

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
    /** Sesiones del bono elegidas en el alta. Vacío = Terranima_Planes::DEFAULT_SESIONES. */
    public const META_SESIONES_CONTRATADAS = 'terranima_sesiones_contratadas';
    /** Educador asignado a la familia (user_id). */
    public const META_EDUCADOR_ID = 'terranima_educador_id';
    /** Nutricionista asignado a la familia (user_id). */
    public const META_NUTRICIONISTA_ID = 'terranima_nutricionista_id';

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
        );
    }

    /**
     * Roles WP que se ofrecen al editar un usuario.
     *
     * @return array<string, string> slug => etiqueta
     */
    public static function roles_usuario()
    {
        return array(
            self::ROLE_FAMILIA        => __('Familia', 'terranima-profile'),
            self::ROLE_EDUCADOR       => __('Educador', 'terranima-profile'),
            self::ROLE_NUTRICIONISTA  => __('Nutricionista', 'terranima-profile'),
        );
    }

    /**
     * @return string[]
     */
    public static function roles_profesional()
    {
        return array(self::ROLE_PROFESIONAL, self::ROLE_EDUCADOR, self::ROLE_NUTRICIONISTA);
    }

    /**
     * Todos los slugs Terranima (no son el rol de contenido de WordPress).
     *
     * @return string[]
     */
    public static function todos_los_roles()
    {
        return array_merge(array(self::ROLE_FAMILIA), self::roles_profesional());
    }

    /**
     * @param string $role
     * @return bool
     */
    public static function es_rol_terranima($role)
    {
        return in_array($role, self::todos_los_roles(), true);
    }

    /**
     * @param WP_User $user
     * @return bool
     */
    public static function user_is_profesional($user)
    {
        if (!$user instanceof WP_User) {
            return false;
        }
        return (bool) array_intersect(self::roles_profesional(), (array) $user->roles);
    }

    /**
     * Acceso al portal /profile: hace falta un rol Terranima, no basta ser administrator.
     *
     * @param WP_User $user
     * @return bool
     */
    public static function user_has_terranima_role($user)
    {
        if (!$user instanceof WP_User) {
            return false;
        }
        return (bool) array_intersect(self::todos_los_roles(), (array) $user->roles);
    }

    /**
     * @param string $status familia|educador|nutricionista
     * @return string especialidad slug o vacío
     */
    public static function especialidad_para_status($status)
    {
        if ($status === 'educador') {
            return 'educacion_canina';
        }
        if ($status === 'nutricionista') {
            return 'nutricion';
        }
        return '';
    }

    /**
     * @param string $role slug WP
     * @return string none|familia|educador|nutricionista
     */
    public static function status_para_rol($role)
    {
        if ($role === self::ROLE_FAMILIA) {
            return 'familia';
        }
        if ($role === self::ROLE_EDUCADOR) {
            return 'educador';
        }
        if ($role === self::ROLE_NUTRICIONISTA) {
            return 'nutricionista';
        }
        if ($role === self::ROLE_PROFESIONAL) {
            return 'educador';
        }
        return 'none';
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
            __('Familia', 'terranima-profile'),
            $caps_familia
        );

        add_role(
            self::ROLE_PROFESIONAL,
            __('Terranima Profesional', 'terranima-profile'),
            $caps_profesional
        );

        add_role(
            self::ROLE_EDUCADOR,
            __('Educador', 'terranima-profile'),
            $caps_profesional
        );

        add_role(
            self::ROLE_NUTRICIONISTA,
            __('Nutricionista', 'terranima-profile'),
            $caps_profesional
        );

        self::set_role_display_name(self::ROLE_FAMILIA, __('Familia', 'terranima-profile'));
        self::set_role_display_name(self::ROLE_EDUCADOR, __('Educador', 'terranima-profile'));
        self::set_role_display_name(self::ROLE_NUTRICIONISTA, __('Nutricionista', 'terranima-profile'));

        // Por si los roles ya existían: asegurar capabilities.
        foreach (array(self::ROLE_FAMILIA) as $slug) {
            $role = get_role($slug);
            if ($role) {
                foreach ($caps_familia as $cap => $grant) {
                    unset($grant);
                    $role->add_cap($cap);
                }
            }
        }

        foreach (self::roles_profesional() as $slug) {
            $role = get_role($slug);
            if ($role) {
                foreach ($caps_profesional as $cap => $grant) {
                    unset($grant);
                    $role->add_cap($cap);
                }
            }
        }

        $admin = get_role('administrator');
        if ($admin) {
            foreach (array_merge(self::caps_compartidas(), array(self::CAP_FAMILIA, self::CAP_PROFESIONAL)) as $cap) {
                if ($cap === 'read') {
                    continue;
                }
                $admin->remove_cap($cap);
            }
        }
    }

    public static function unregister()
    {
        remove_role(self::ROLE_FAMILIA);
        remove_role(self::ROLE_PROFESIONAL);
        remove_role(self::ROLE_EDUCADOR);
        remove_role(self::ROLE_NUTRICIONISTA);

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

    /**
     * add_role() no actualiza la etiqueta si el rol ya existe.
     *
     * @param string $slug
     * @param string $name
     */
    private static function set_role_display_name($slug, $name)
    {
        $wp_roles = wp_roles();
        if (!$wp_roles instanceof WP_Roles || !isset($wp_roles->roles[$slug])) {
            return;
        }
        $wp_roles->roles[$slug]['name'] = $name;
        $wp_roles->role_names[$slug] = $name;
        update_option($wp_roles->role_key, $wp_roles->roles);
    }
}
