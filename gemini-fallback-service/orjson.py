import json as stdjson

def loads(s):
    return stdjson.loads(s)

def dumps(obj, default=None, option=None):
    return stdjson.dumps(obj, default=default).encode('utf-8')

JSONDecodeError = stdjson.JSONDecodeError

OPT_INDENT_2 = 1
OPT_APPEND_NEWLINE = 2
OPT_SORT_KEYS = 4
OPT_OMIT_MICROSECONDS = 8
OPT_NON_STR_KEYS = 16
