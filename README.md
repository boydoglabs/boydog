# boy.dog framework for realtime web-apps

Status: Early alpha

### boyLogic middleware functions:

 - |r|: On read event of the current value
 - |w|: On write event of the current value
 - |rw|: On read or write event of the current value (the execution order is _rw, _r, _w)
 
 - |middle-r|: Executed on read of a value inside the current level
 - |middle-w|: Executed on write of a value inside the current level
 - |middle-rw|: Executed on read or write of a value inside the current level (the execution order is _mrw, _mr, _mw)

## License

[MIT] © boy.dog