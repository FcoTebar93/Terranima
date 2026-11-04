<?php
/**
 * Asignación de educador + nutricionista a cada familia (1 de cada, aleatorio al alta).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Asignaciones
{
    /**
     * @param int  $familia_id
     * @param bool $only_fill_missing Si true, no sustituye IDs ya guardados.
     * @return array{educador: int, nutricionista: int}
     */
    public static function ensure_for_familia($familia_id, $only_fill_missing = true)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return array('educador' => 0, 'nutricionista' => 0);
        }

        $current = self::get_ids($familia_id);
        $educador = $current['educador'];
        $nutri = $current['nutricionista'];

        if (!$only_fill_missing || $educador <= 0 || !self::is_active_profesional($educador, 'educacion_canina')) {
            $educador = self::pick_random_profesional('educacion_canina');
            if ($educador > 0) {
                update_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID, $educador);
            } else {
                delete_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID);
            }
        }

        if (!$only_fill_missing || $nutri <= 0 || !self::is_active_profesional($nutri, 'nutricion')) {
            $nutri = self::pick_random_profesional('nutricion');
            if ($nutri > 0) {
                update_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID, $nutri);
            } else {
                delete_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID);
            }
        }

        return array(
            'educador'       => (int) get_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID, true),
            'nutricionista'  => (int) get_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID, true),
        );
    }

    /**
     * @param int $familia_id
     * @param int $educador_id
     * @param int $nutricionista_id
     */
    public static function set_for_familia($familia_id, $educador_id, $nutricionista_id)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return;
        }

        $educador_id = (int) $educador_id;
        $nutricionista_id = (int) $nutricionista_id;

        if ($educador_id > 0 && self::is_active_profesional($educador_id, 'educacion_canina')) {
            update_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID, $educador_id);
        } elseif ($educador_id <= 0) {
            delete_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID);
        }

        if ($nutricionista_id > 0 && self::is_active_profesional($nutricionista_id, 'nutricion')) {
            update_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID, $nutricionista_id);
        } elseif ($nutricionista_id <= 0) {
            delete_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID);
        }
    }

    /**
     * @param int $familia_id
     */
    public static function clear_for_familia($familia_id)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return;
        }
        delete_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID);
        delete_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID);
    }

    /**
     * @param int $familia_id
     * @return array{educador: int, nutricionista: int}
     */
    public static function get_ids($familia_id)
    {
        $familia_id = (int) $familia_id;
        return array(
            'educador'      => (int) get_user_meta($familia_id, Terranima_Roles::META_EDUCADOR_ID, true),
            'nutricionista' => (int) get_user_meta($familia_id, Terranima_Roles::META_NUTRICIONISTA_ID, true),
        );
    }

    /**
     * Equipo de seguimiento de una familia (máx. 1 educador + 1 nutricionista).
     *
     * @param int $familia_id
     * @return array<int, array<string, mixed>>
     */
    public static function get_equipo($familia_id)
    {
        self::ensure_for_familia($familia_id, true);
        $ids = self::get_ids($familia_id);
        $out = array();

        foreach (array($ids['educador'], $ids['nutricionista']) as $uid) {
            if ($uid <= 0) {
                continue;
            }
            $u = get_userdata($uid);
            if (!$u instanceof WP_User) {
                continue;
            }
            $slug = (string) get_user_meta($uid, Terranima_Roles::META_ESPECIALIDAD, true);
            if ($slug === 'terapia_familiar') {
                continue;
            }
            $out[] = array(
                'id'               => $uid,
                'nombre'           => Terranima_Auth::get_display_name($u),
                'especialidad'     => Terranima_Auth::especialidad_label($slug) ?: $slug,
                'especialidadSlug' => $slug,
            );
        }

        return $out;
    }

    /**
     * Familias asignadas a un profesional.
     *
     * @param int|WP_User $profesional
     * @return array<int, int>
     */
    public static function familia_ids_for_profesional($profesional)
    {
        $user = $profesional instanceof WP_User ? $profesional : get_userdata((int) $profesional);
        if (!$user instanceof WP_User) {
            return array();
        }
        if (Terranima_Auth::get_tipo($user) !== Terranima_Roles::TIPO_PROFESIONAL) {
            return array();
        }

        $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);
        $meta_key = '';
        if ($esp === 'educacion_canina') {
            $meta_key = Terranima_Roles::META_EDUCADOR_ID;
        } elseif ($esp === 'nutricion') {
            $meta_key = Terranima_Roles::META_NUTRICIONISTA_ID;
        }
        if ($meta_key === '') {
            return array();
        }

        // Rellenar huecos en familias sin asignación (p. ej. altas antiguas).
        self::backfill_missing();

        $users = get_users(
            array(
                'role'       => Terranima_Roles::ROLE_FAMILIA,
                'number'     => 500,
                'fields'     => 'ID',
                'meta_key'   => $meta_key,
                'meta_value' => (string) (int) $user->ID,
            )
        );

        $ids = array();
        foreach ($users as $id) {
            $ids[] = (int) $id;
        }
        return array_values(array_unique($ids));
    }

    /**
     * @param int $profesional_id
     * @param int $familia_id
     * @return bool
     */
    public static function profesional_is_assigned_to_familia($profesional_id, $familia_id)
    {
        $profesional_id = (int) $profesional_id;
        $familia_id = (int) $familia_id;
        if ($profesional_id <= 0 || $familia_id <= 0) {
            return false;
        }
        self::ensure_for_familia($familia_id, true);
        $ids = self::get_ids($familia_id);
        return $profesional_id === $ids['educador'] || $profesional_id === $ids['nutricionista'];
    }

    /**
     * @param int    $familia_id
     * @param string $especialidad_slug
     * @return int
     */
    public static function profesional_id_for_especialidad($familia_id, $especialidad_slug)
    {
        $familia_id = (int) $familia_id;
        $especialidad_slug = (string) $especialidad_slug;
        if ($familia_id <= 0 || $especialidad_slug === '') {
            return 0;
        }

        self::ensure_for_familia($familia_id, true);
        $ids = self::get_ids($familia_id);

        if ($especialidad_slug === 'educacion_canina') {
            return $ids['educador'];
        }
        if ($especialidad_slug === 'nutricion') {
            return $ids['nutricionista'];
        }
        return 0;
    }

    /**
     * Profesionales activos de una especialidad (para selects de admin / urgencias).
     *
     * @param string $especialidad_slug
     * @return array<int, array{id: int, nombre: string}>
     */
    public static function list_activos_por_especialidad($especialidad_slug)
    {
        $ids = self::ids_activos_por_especialidad($especialidad_slug);
        $out = array();
        foreach ($ids as $id) {
            $u = get_userdata($id);
            if (!$u) {
                continue;
            }
            $out[] = array(
                'id'     => $id,
                'nombre' => Terranima_Auth::get_display_name($u),
            );
        }
        return $out;
    }

    /**
     * Rellena educador/nutricionista en familias que aún no los tienen.
     */
    public static function backfill_missing()
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        $familias = get_users(
            array(
                'role'   => Terranima_Roles::ROLE_FAMILIA,
                'number' => 500,
                'fields' => 'ID',
            )
        );
        foreach ($familias as $id) {
            self::ensure_for_familia((int) $id, true);
        }
    }

    /**
     * @param string $especialidad_slug
     * @return int
     */
    public static function pick_random_profesional($especialidad_slug)
    {
        $ids = self::ids_activos_por_especialidad($especialidad_slug);
        if (empty($ids)) {
            return 0;
        }
        if (count($ids) === 1) {
            return (int) $ids[0];
        }
        $key = array_rand($ids);
        return (int) $ids[$key];
    }

    /**
     * @param string $especialidad_slug
     * @return array<int, int>
     */
    public static function ids_activos_por_especialidad($especialidad_slug)
    {
        $especialidad_slug = (string) $especialidad_slug;
        if ($especialidad_slug === '') {
            return array();
        }

        $users = get_users(
            array(
                'role__in'   => Terranima_Roles::roles_profesional(),
                'number'     => 200,
                'fields'     => 'ID',
                'meta_key'   => Terranima_Roles::META_ESPECIALIDAD,
                'meta_value' => $especialidad_slug,
            )
        );

        $ids = array();
        foreach ($users as $id) {
            $id = (int) $id;
            if (!self::is_active_profesional($id, $especialidad_slug)) {
                continue;
            }
            $ids[] = $id;
        }
        return array_values(array_unique($ids));
    }

    /**
     * @param int    $user_id
     * @param string $especialidad_slug Vacío = cualquier especialidad profesional.
     * @return bool
     */
    public static function is_active_profesional($user_id, $especialidad_slug = '')
    {
        $user_id = (int) $user_id;
        if ($user_id <= 0) {
            return false;
        }
        $user = get_userdata($user_id);
        if (!$user instanceof WP_User) {
            return false;
        }
        if (Terranima_Auth::get_tipo($user) !== Terranima_Roles::TIPO_PROFESIONAL) {
            return false;
        }
        if (!Terranima_Auth::user_can_access($user)) {
            return false;
        }
        if ($especialidad_slug !== '') {
            $esp = (string) get_user_meta($user_id, Terranima_Roles::META_ESPECIALIDAD, true);
            if ($esp !== $especialidad_slug) {
                return false;
            }
        }
        return true;
    }
}
