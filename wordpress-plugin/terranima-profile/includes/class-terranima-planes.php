<?php
/**
 * Planes y bonos de sesiones (CPT terranima_plan).
 *
 * Por ahora cada familia recibe un bono de 8 sesiones al activarse.
 * El total puede venir de user_meta terranima_sesiones_contratadas (alta).
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_Planes
{
    public const META_TIPO = 'tipo';
    public const META_ESTADO = 'estado';
    public const META_FAMILIA = 'familia_user_id';
    public const META_FECHA_INICIO = 'fecha_inicio';
    public const META_FECHA_FIN = 'fecha_fin';
    public const META_SESIONES_TOTAL = 'sesiones_total';
    public const META_SESIONES_USADAS = 'sesiones_usadas';

    public const TIPO_BONO = 'bono';
    public const ESTADO_ACTIVO = 'activo';
    public const ESTADO_AGOTADO = 'agotado';

    /** Por defecto hasta que el alta fije terranima_sesiones_contratadas. */
    public const DEFAULT_SESIONES = 8;

    /**
     * @param int $post_id
     * @return array<string, mixed>|null
     */
    public static function serialize($post_id)
    {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== Terranima_CPTs::PLAN) {
            return null;
        }

        $total = max(0, (int) get_post_meta($post_id, self::META_SESIONES_TOTAL, true));
        $usadas = max(0, (int) get_post_meta($post_id, self::META_SESIONES_USADAS, true));
        if ($total <= 0) {
            $total = self::DEFAULT_SESIONES;
        }
        $restantes = max(0, $total - $usadas);
        $pct = $total > 0 ? (int) round(($usadas / $total) * 100) : 0;

        return array(
            'id'                 => (string) $post_id,
            'titulo'             => $post->post_title,
            'subtitulo'          => __('Sesiones con el equipo', 'terranima-profile'),
            'tipo'               => (string) get_post_meta($post_id, self::META_TIPO, true) ?: self::TIPO_BONO,
            'estado'             => $restantes > 0 ? self::ESTADO_ACTIVO : self::ESTADO_AGOTADO,
            'familiaUserId'      => (int) get_post_meta($post_id, self::META_FAMILIA, true),
            'fechaInicio'        => (string) get_post_meta($post_id, self::META_FECHA_INICIO, true),
            'fechaFin'           => (string) get_post_meta($post_id, self::META_FECHA_FIN, true),
            'sesionesTotal'      => $total,
            'sesionesUsadas'     => min($usadas, $total),
            'sesionesRestantes'  => $restantes,
            'progresoPct'        => min(100, $pct),
            'progresoLabel'      => __('Sesiones usadas', 'terranima-profile'),
            'detalle'            => sprintf(
                /* translators: 1: used sessions, 2: total sessions */
                __('Has usado %1$d de %2$d sesiones', 'terranima-profile'),
                min($usadas, $total),
                $total
            ),
        );
    }

    /**
     * @param int $familia_id
     * @return array<int, array<string, mixed>>
     */
    public static function query_for_familia($familia_id)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return array();
        }

        $q = new WP_Query(
            array(
                'post_type'      => Terranima_CPTs::PLAN,
                'post_status'    => 'publish',
                'posts_per_page' => 10,
                'orderby'        => 'date',
                'order'          => 'DESC',
                'meta_query'     => array(
                    array(
                        'key'   => self::META_FAMILIA,
                        'value' => $familia_id,
                        'type'  => 'NUMERIC',
                    ),
                ),
                'no_found_rows'  => true,
            )
        );

        $out = array();
        foreach ($q->posts as $post) {
            $item = self::serialize($post->ID);
            if ($item) {
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * Crea el bono si la familia no tiene ninguno.
     *
     * @param int      $familia_id
     * @param int|null $sesiones_total Null = meta de alta o 8.
     * @return int|WP_Error plan post ID
     */
    public static function ensure_for_familia($familia_id, $sesiones_total = null)
    {
        $familia_id = (int) $familia_id;
        if ($familia_id <= 0) {
            return new WP_Error('terranima_plan_familia', __('Indica la familia del plan.', 'terranima-profile'), array('status' => 400));
        }

        $existing = self::active_plan_id($familia_id);
        if ($existing) {
            return $existing;
        }

        $total = $sesiones_total !== null ? (int) $sesiones_total : self::sesiones_contratadas($familia_id);
        if ($total <= 0) {
            $total = self::DEFAULT_SESIONES;
        }

        $usadas = 0;

        $post_id = wp_insert_post(
            array(
                'post_type'   => Terranima_CPTs::PLAN,
                'post_status' => 'publish',
                'post_title'  => __('Bono de sesiones', 'terranima-profile'),
                'post_author' => $familia_id,
            ),
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $hoy = current_time('Y-m-d');
        update_post_meta($post_id, self::META_TIPO, self::TIPO_BONO);
        update_post_meta($post_id, self::META_ESTADO, $usadas >= $total ? self::ESTADO_AGOTADO : self::ESTADO_ACTIVO);
        update_post_meta($post_id, self::META_FAMILIA, $familia_id);
        update_post_meta($post_id, self::META_FECHA_INICIO, $hoy);
        update_post_meta($post_id, self::META_SESIONES_TOTAL, $total);
        update_post_meta($post_id, self::META_SESIONES_USADAS, $usadas);

        return (int) $post_id;
    }

    /**
     * @param int $familia_id
     * @return int
     */
    public static function sesiones_contratadas($familia_id)
    {
        $meta = (int) get_user_meta($familia_id, Terranima_Roles::META_SESIONES_CONTRATADAS, true);
        return $meta > 0 ? $meta : self::DEFAULT_SESIONES;
    }

    /**
     * @param int $familia_id
     * @return int post ID or 0
     */
    public static function active_plan_id($familia_id)
    {
        $items = self::query_for_familia($familia_id);
        if (empty($items)) {
            return 0;
        }

        foreach ($items as $item) {
            if ((int) $item['sesionesRestantes'] > 0) {
                return (int) $item['id'];
            }
        }

        return (int) $items[0]['id'];
    }

    /**
     * @param int $familia_id
     * @return int
     */
    public static function remaining($familia_id)
    {
        $plan_id = self::ensure_for_familia($familia_id);
        if (is_wp_error($plan_id)) {
            return 0;
        }

        $item = self::serialize((int) $plan_id);
        return $item ? (int) $item['sesionesRestantes'] : 0;
    }

    /**
     * Resta una sesión al registrar una cita.
     *
     * @param int $familia_id
     * @param int $cita_id
     * @return int|WP_Error plan ID
     */
    public static function consume($familia_id, $cita_id)
    {
        $cita_id = (int) $cita_id;
        $familia_id = (int) $familia_id;

        if ($cita_id > 0 && (int) get_post_meta($cita_id, Terranima_Citas::META_CUPO_CONSUMIDO, true) === 1) {
            return (int) get_post_meta($cita_id, Terranima_Citas::META_PLAN_ID, true);
        }

        $plan_id = self::ensure_for_familia($familia_id);
        if (is_wp_error($plan_id)) {
            return $plan_id;
        }
        $plan_id = (int) $plan_id;

        $total = max(1, (int) get_post_meta($plan_id, self::META_SESIONES_TOTAL, true));
        $updated = self::increment_usadas($plan_id, $total);
        if (!$updated) {
            return new WP_Error(
                'terranima_plan_agotado',
                __('No quedan sesiones en el plan. Contacta con el equipo para ampliar el bono.', 'terranima-profile'),
                array('status' => 409)
            );
        }

        $usadas = (int) get_post_meta($plan_id, self::META_SESIONES_USADAS, true);
        update_post_meta($plan_id, self::META_ESTADO, $usadas >= $total ? self::ESTADO_AGOTADO : self::ESTADO_ACTIVO);

        if ($cita_id > 0) {
            update_post_meta($cita_id, Terranima_Citas::META_PLAN_ID, $plan_id);
            update_post_meta($cita_id, Terranima_Citas::META_CUPO_CONSUMIDO, 1);
        }

        return $plan_id;
    }

    /**
     * Devuelve la sesión si se cancela o rechaza una cita que ya descontó cupo.
     *
     * @param int $cita_id
     */
    public static function restore($cita_id)
    {
        $cita_id = (int) $cita_id;
        if ($cita_id <= 0) {
            return;
        }

        if ((int) get_post_meta($cita_id, Terranima_Citas::META_CUPO_CONSUMIDO, true) !== 1) {
            return;
        }

        $plan_id = (int) get_post_meta($cita_id, Terranima_Citas::META_PLAN_ID, true);
        if ($plan_id <= 0) {
            return;
        }

        self::decrement_usadas($plan_id);
        $item = self::serialize($plan_id);
        if ($item && (int) $item['sesionesRestantes'] > 0) {
            update_post_meta($plan_id, self::META_ESTADO, self::ESTADO_ACTIVO);
        }

        delete_post_meta($cita_id, Terranima_Citas::META_CUPO_CONSUMIDO);
    }

    /**
     * @param int $familia_id
     * @return int
     */
    public static function count_citas_que_consumen($familia_id)
    {
        $q = new WP_Query(
            array(
                'post_type'      => Terranima_CPTs::CITA,
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    'relation' => 'AND',
                    array(
                        'key'   => Terranima_Citas::META_FAMILIA_USER,
                        'value' => (int) $familia_id,
                        'type'  => 'NUMERIC',
                    ),
                    array(
                        'key'     => Terranima_Citas::META_ESTADO,
                        'value'   => array('pendiente', 'confirmada', 'completada'),
                        'compare' => 'IN',
                    ),
                ),
            )
        );

        return (int) $q->found_posts;
    }

    /**
     * @param int $plan_id
     * @param int $total
     * @return bool
     */
    private static function increment_usadas($plan_id, $total)
    {
        global $wpdb;

        $affected = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->postmeta} SET meta_value = meta_value + 1
                WHERE post_id = %d AND meta_key = %s AND CAST(meta_value AS UNSIGNED) < %d",
                $plan_id,
                self::META_SESIONES_USADAS,
                $total
            )
        );

        clean_post_cache($plan_id);
        wp_cache_delete($plan_id, 'post_meta');

        return $affected === 1;
    }

    /**
     * @param int $plan_id
     */
    private static function decrement_usadas($plan_id)
    {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->postmeta} SET meta_value = meta_value - 1
                WHERE post_id = %d AND meta_key = %s AND CAST(meta_value AS UNSIGNED) > 0",
                $plan_id,
                self::META_SESIONES_USADAS
            )
        );

        clean_post_cache($plan_id);
        wp_cache_delete($plan_id, 'post_meta');
    }
}
