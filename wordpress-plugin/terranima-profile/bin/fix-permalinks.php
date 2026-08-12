<?php
require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/misc.php';

global $wp_rewrite;
$wp_rewrite->set_permalink_structure('/%postname%/');

if (function_exists('terranima_profile_rewrite_rules')) {
    terranima_profile_rewrite_rules();
}

flush_rewrite_rules(true);

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

insert_with_markers(ABSPATH . '.htaccess', 'WordPress', $rules);

echo file_get_contents(ABSPATH . '.htaccess');
echo "\nrest=" . rest_url('terranima/v1/me') . "\n";
