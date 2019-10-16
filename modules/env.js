function getBasePath() {
    var path = $.getenv('CF_USER_BASE_PATH'); 
    if(!!path) {
        return path;
    }
    return '~';
}

function getEnv(env) {
    $.getenv(env)
}