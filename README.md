# framews
ws testing


### boyLogic middleware functions:

 - _r: On read event of the current value
 - _w: On write event of the current value
 - _rw: On read or write event of the current value (the execution order is _rw, _r, _w)
 
 - _mr: Executed on read of a value inside the current level
 - _mw: Executed on write of a value inside the current level
 - _mrw: Executed on read or write of a value inside the current level (the execution order is _mrw, _mr, _mw)