from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    
    response = {
        'status': 'Success'
    }

    if data is not None:
        response['data'] = data
    if message is not None:
        response['message'] = message
    
    return jsonify(response), status_code

def error_response(message=None, status_code=400):
    
    response = {
        'status': 'error'
    }

    if message is not None:
        response['message'] = message
    
    return jsonify(response), status_code