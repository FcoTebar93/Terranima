<?php
/**
 * Configuración Terranima en el perfil de usuario de WordPress.
 * El rol de contenido (Editor, Administrador…) y el de Terranima son independientes.
 *
 * @package Terranima_Profile
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Terranima_User_Admin
{
    /** @var bool */
    private static $saving = false;

    public static function register_hooks()
    {
        add_action('show_user_profile', array(__CLASS__, 'render_fields'));
        add_action('edit_user_profile', array(__CLASS__, 'render_fields'));
        add_action('personal_options_update', array(__CLASS__, 'save_fields'));
        add_action('edit_user_profile_update', array(__CLASS__, 'save_fields'));
        add_action('set_user_role', array(__CLASS__, 'on_set_user_role'), 10, 2);
        add_filter('editable_roles', array(__CLASS__, 'filter_editable_roles'));
        add_filter('manage_users_columns', array(__CLASS__, 'users_column'));
        add_filter('manage_users_custom_column', array(__CLASS__, 'users_column_content'), 10, 3);
        add_filter('manage_users_sortable_columns', array(__CLASS__, 'users_sortable'));
    }

    /**
     * Oculta los roles Terranima del desplegable nativo de WordPress.
     * Ahí solo deben quedar Editor, Administrador, Cliente, etc.
     *
     * @param array<string, array<string, mixed>> $roles
     * @return array<string, array<string, mixed>>
     */
    public static function filter_editable_roles($roles)
    {
        foreach (Terranima_Roles::todos_los_roles() as $slug) {
            unset($roles[$slug]);
        }

        return $roles;
    }

    /**
     * set_role() de WP borra el resto de roles. Volvemos a poner el de Terranima
     * desde la meta, sin tocar Editor/Admin/Cliente.
     *
     * @param int    $user_id
     * @param string $role
     */
    public static function on_set_user_role($user_id, $role)
    {
        if (self::$saving) {
            return;
        }
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }

        self::$saving = true;
        if (Terranima_Roles::es_rol_terranima($role)) {
            $status = Terranima_Roles::status_para_rol($role);
            if ($role === Terranima_Roles::ROLE_PROFESIONAL) {
                $esp = (string) get_user_meta($user_id, Terranima_Roles::META_ESPECIALIDAD, true);
                if ($esp === 'nutricion') {
                    $status = 'nutricionista';
                } elseif ($esp === 'terapia_familiar') {
                    $status = 'terapia';
                }
            }
            if ($status !== 'none') {
                self::apply_status($user, $status);
            }
        } else {
            $status = self::status_from_meta($user);
            if ($status !== 'none') {
                self::apply_status($user, $status);
            }
        }
        self::$saving = false;
    }

    /**
     * @param WP_User $user
     */
    public static function render_fields($user)
    {
        if (!current_user_can('promote_users') || !($user instanceof WP_User)) {
            return;
        }

        $status = self::current_status($user);
        $nombre_familia = (string) get_user_meta($user->ID, Terranima_Roles::META_NOMBRE_FAMILIA, true);
        $numero_socio = (string) get_user_meta($user->ID, Terranima_Roles::META_NUMERO_SOCIO, true);
        $direccion = (string) get_user_meta($user->ID, Terranima_Roles::META_DIRECCION, true);
        $activo_meta = get_user_meta($user->ID, Terranima_Roles::META_ACTIVO, true);
        $activo = !($activo_meta !== '' && $activo_meta !== false && (int) $activo_meta === 0);
        $is_admin = in_array('administrator', (array) $user->roles, true);
        ?>
        <h2><?php esc_html_e('Terranima', 'terranima-profile'); ?></h2>
        <table class="form-table" role="presentation">
            <tr>
                <th><label for="terranima_status"><?php esc_html_e('Rol Terranima', 'terranima-profile'); ?></label></th>
                <td>
                    <?php wp_nonce_field('terranima_user_admin', 'terranima_user_admin_nonce'); ?>
                    <select name="terranima_status" id="terranima_status">
                        <option value="none" <?php selected($status, 'none'); ?>><?php esc_html_e('Sin acceso (no usa Terranima)', 'terranima-profile'); ?></option>
                        <option value="familia" <?php selected($status, 'familia'); ?>><?php esc_html_e('Familia', 'terranima-profile'); ?></option>
                        <optgroup label="<?php echo esc_attr__('Profesional', 'terranima-profile'); ?>">
                            <option value="educador" <?php selected($status, 'educador'); ?>><?php esc_html_e('Educador', 'terranima-profile'); ?></option>
                            <option value="nutricionista" <?php selected($status, 'nutricionista'); ?>><?php esc_html_e('Nutricionista', 'terranima-profile'); ?></option>
                            <option value="terapia" <?php selected($status, 'terapia'); ?>><?php esc_html_e('Terapia familiar', 'terranima-profile'); ?></option>
                        </optgroup>
                    </select>
                    <p class="description">
                        <?php esc_html_e('Independiente del rol de WordPress (arriba: Editor, Administrador, Cliente…). Puedes combinarlos: por ejemplo Editor + Educador, o Administrador + Familia.', 'terranima-profile'); ?>
                    </p>
                    <?php if ($is_admin && $status === 'none') : ?>
                        <p class="description" style="color:#996800;">
                            <?php esc_html_e('Esta cuenta es administradora: puede entrar a /profile aunque no tenga rol Terranima, y se verá como familia. Asígnale Educador o Nutricionista si forma parte del equipo.', 'terranima-profile'); ?>
                        </p>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <th><label for="terranima_nombre_familia"><?php esc_html_e('Nombre de familia', 'terranima-profile'); ?></label></th>
                <td>
                    <input type="text" class="regular-text" name="terranima_nombre_familia" id="terranima_nombre_familia" value="<?php echo esc_attr($nombre_familia); ?>" />
                    <p class="description"><?php esc_html_e('Solo aplica a familias.', 'terranima-profile'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="terranima_numero_socio"><?php esc_html_e('Número de socio', 'terranima-profile'); ?></label></th>
                <td>
                    <input type="text" class="regular-text" name="terranima_numero_socio" id="terranima_numero_socio" value="<?php echo esc_attr($numero_socio); ?>" />
                </td>
            </tr>
            <tr>
                <th><label for="terranima_direccion"><?php esc_html_e('Dirección', 'terranima-profile'); ?></label></th>
                <td>
                    <input type="text" class="regular-text" name="terranima_direccion" id="terranima_direccion" value="<?php echo esc_attr($direccion); ?>" />
                </td>
            </tr>
            <tr>
                <th><?php esc_html_e('Cuenta activa', 'terranima-profile'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="terranima_activo" value="1" <?php checked($activo); ?> />
                        <?php esc_html_e('Puede iniciar sesión en el área Terranima', 'terranima-profile'); ?>
                    </label>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * @param int $user_id
     */
    public static function save_fields($user_id)
    {
        if (!current_user_can('promote_users')) {
            return;
        }
        if (!isset($_POST['terranima_user_admin_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['terranima_user_admin_nonce'])), 'terranima_user_admin')) {
            return;
        }
        if (!current_user_can('edit_user', $user_id)) {
            return;
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }

        $status = isset($_POST['terranima_status']) ? sanitize_key(wp_unslash($_POST['terranima_status'])) : 'none';
        if (!in_array($status, array('none', 'familia', 'cliente', 'educador', 'nutricionista', 'terapia'), true)) {
            $status = 'none';
        }
        if ($status === 'cliente') {
            $status = 'familia';
        }

        self::$saving = true;
        self::apply_status($user, $status);
        self::$saving = false;

        update_user_meta($user_id, Terranima_Roles::META_NOMBRE_FAMILIA, isset($_POST['terranima_nombre_familia']) ? sanitize_text_field(wp_unslash($_POST['terranima_nombre_familia'])) : '');
        update_user_meta($user_id, Terranima_Roles::META_NUMERO_SOCIO, isset($_POST['terranima_numero_socio']) ? sanitize_text_field(wp_unslash($_POST['terranima_numero_socio'])) : '');
        update_user_meta($user_id, Terranima_Roles::META_DIRECCION, isset($_POST['terranima_direccion']) ? sanitize_text_field(wp_unslash($_POST['terranima_direccion'])) : '');
        update_user_meta($user_id, Terranima_Roles::META_ACTIVO, !empty($_POST['terranima_activo']) ? '1' : '0');
    }

    /**
     * @param WP_User $user
     * @param string  $status none|familia|educador|nutricionista|terapia
     */
    public static function apply_status($user, $status)
    {
        self::clear_terranima_roles($user);

        if ($status === 'educador' || $status === 'nutricionista' || $status === 'terapia') {
            $user->add_role(Terranima_Roles::ROLE_PROFESIONAL);
            if ($status === 'educador') {
                $user->add_role(Terranima_Roles::ROLE_EDUCADOR);
            } elseif ($status === 'nutricionista') {
                $user->add_role(Terranima_Roles::ROLE_NUTRICIONISTA);
            }
            update_user_meta($user->ID, Terranima_Roles::META_TIPO, Terranima_Roles::TIPO_PROFESIONAL);
            $esp = $status === 'terapia' ? 'terapia_familiar' : Terranima_Roles::especialidad_para_status($status);
            update_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, $esp);
            self::ensure_wordpress_base_role($user);
            return;
        }

        if ($status === 'familia') {
            $user->add_role(Terranima_Roles::ROLE_FAMILIA);
            update_user_meta($user->ID, Terranima_Roles::META_TIPO, Terranima_Roles::TIPO_FAMILIA);
            delete_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD);
            self::ensure_wordpress_base_role($user);
            return;
        }

        delete_user_meta($user->ID, Terranima_Roles::META_TIPO);
        delete_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD);
        self::ensure_wordpress_base_role($user);
    }

    /**
     * Si solo quedan roles Terranima (ocultos en el desplegable), deja Subscriber
     * para no vaciar el rol de WordPress.
     *
     * @param WP_User $user
     */
    private static function ensure_wordpress_base_role($user)
    {
        $restantes = array_diff((array) $user->roles, Terranima_Roles::todos_los_roles());
        if (empty($restantes)) {
            $user->add_role('subscriber');
        }
    }

    /**
     * @param WP_User $user
     */
    private static function clear_terranima_roles($user)
    {
        $user->remove_role(Terranima_Roles::ROLE_FAMILIA);
        foreach (Terranima_Roles::roles_profesional() as $role) {
            $user->remove_role($role);
        }
    }

    /**
     * @param WP_User $user
     * @return string none|familia|educador|nutricionista|terapia
     */
    public static function status_from_meta($user)
    {
        $tipo = (int) get_user_meta($user->ID, Terranima_Roles::META_TIPO, true);
        $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);

        if ($tipo === Terranima_Roles::TIPO_FAMILIA) {
            return 'familia';
        }
        if ($tipo === Terranima_Roles::TIPO_PROFESIONAL) {
            if ($esp === 'nutricion') {
                return 'nutricionista';
            }
            if ($esp === 'terapia_familiar') {
                return 'terapia';
            }
            return 'educador';
        }
        return 'none';
    }

    /**
     * @param WP_User $user
     * @return string none|familia|educador|nutricionista|terapia
     */
    public static function current_status($user)
    {
        $roles = (array) $user->roles;
        $esp = (string) get_user_meta($user->ID, Terranima_Roles::META_ESPECIALIDAD, true);

        if (in_array(Terranima_Roles::ROLE_NUTRICIONISTA, $roles, true)) {
            return 'nutricionista';
        }
        if (in_array(Terranima_Roles::ROLE_EDUCADOR, $roles, true)) {
            return 'educador';
        }
        if (in_array(Terranima_Roles::ROLE_PROFESIONAL, $roles, true)) {
            if ($esp === 'nutricion') {
                return 'nutricionista';
            }
            if ($esp === 'terapia_familiar') {
                return 'terapia';
            }
            return 'educador';
        }
        if (in_array(Terranima_Roles::ROLE_FAMILIA, $roles, true)) {
            return 'familia';
        }

        return self::status_from_meta($user);
    }

    /**
     * @param array<string, string> $columns
     * @return array<string, string>
     */
    public static function users_column($columns)
    {
        $columns['terranima'] = __('Terranima', 'terranima-profile');
        return $columns;
    }

    /**
     * @param array<string, string> $columns
     * @return array<string, string>
     */
    public static function users_sortable($columns)
    {
        $columns['terranima'] = 'terranima';
        return $columns;
    }

    /**
     * @param string $output
     * @param string $column
     * @param int    $user_id
     * @return string
     */
    public static function users_column_content($output, $column, $user_id)
    {
        if ($column !== 'terranima') {
            return $output;
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return '—';
        }

        $labels = array(
            'familia'       => __('Familia', 'terranima-profile'),
            'educador'      => __('Educador', 'terranima-profile'),
            'nutricionista' => __('Nutricionista', 'terranima-profile'),
            'terapia'       => __('Terapia familiar', 'terranima-profile'),
        );
        $status = self::current_status($user);
        if (isset($labels[$status])) {
            return esc_html($labels[$status]);
        }
        if (in_array('administrator', (array) $user->roles, true)) {
            return esc_html__('Admin (sin rol Terranima)', 'terranima-profile');
        }
        return '—';
    }
}
