<?php
function renderTemplate($template, $data = []) {
    extract($data);
    ob_start();
    include "../public/templates/$template.html";
    return ob_get_clean();
}
?>
