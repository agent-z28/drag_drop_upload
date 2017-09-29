# -*- coding: utf-8 -*-

import base64
import functools
import logging
import simplejson
import werkzeug.utils
import werkzeug.wrappers

try:
    import xlwt
except ImportError:
    xlwt = None

from odoo import http
from odoo.http import request, serialize_exception as _serialize_exception

_logger = logging.getLogger(__name__)

def serialize_exception(f):
    @functools.wraps(f)
    def wrap(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception, e:
            _logger.exception("An exception occured during an http request")
            se = _serialize_exception(e)
            error = {
                'code': 200,
                'message': "Odoo Server Error",
                'data': se
            }
            return werkzeug.exceptions.InternalServerError(simplejson.dumps(error))
    return wrap


class Binary(http.Controller):

    @http.route('/ddup/binary/upload', type='http', auth="user", csrf=False)
    @serialize_exception
    def upload(self, callback, ufile):
        # TODO: might be useful to have a configuration flag for max-length file uploads
        out = """<script language="javascript" type="text/javascript">
                    var win = window.top.window;
                    win.jQuery(win).trigger(%s, %s);
                </script>"""
        try:
            data = ufile.read()
            args = [len(data), ufile.filename,
                    ufile.content_type, base64.b64encode(data)]
        except Exception, e:
            args = [False, e.message]
        return out % (simplejson.dumps(callback), simplejson.dumps(args))

    @http.route('/ddup/binary/upload_attachment', type='http', auth="user", csrf=False)
    @serialize_exception
    def upload_attachment(self, callback, model, id, ufile, paper_id, paper_date):
        attachments = request.env['ir.attachment']
        out = """<script language="javascript" type="text/javascript">
                    var win = window.top.window;
                    win.jQuery(win).trigger(%s, %s);
                </script>"""
        try:
            import ipdb
            ipdb.set_trace()
            res = {
                'name': ufile.filename,
                'datas': base64.encodestring(ufile.read()),
                'datas_fname': ufile.filename,
                'res_model': model,
                'res_id': int(id)
            }
            if paper_id != 'false':
                res.update({'paper_id' : paper_id})
            if paper_date != 'false':    
                res.update({'paper_date' : paper_date})
            attachment_id = attachments.create(res)
            args = {
                'filename': ufile.filename,
                'id':  attachment_id.id
            }
        except Exception:
            args = {'error': "Something horrible happened"}
        return out % (simplejson.dumps(callback), simplejson.dumps(args))

