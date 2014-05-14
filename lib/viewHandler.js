var logger = require("./logger");

module.exports.show = function(err, command, data) {
    if(err) {
	   return handleError(err);
    } else {
	   return handleSuccess(command, data);
    }
};

function handleError(err) {
    logger.error("Error during command execution:");
    logger.error(err);
}

function handleSuccess(cmd, data) {
	return cmd.view(data).render();
}