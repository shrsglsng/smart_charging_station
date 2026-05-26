# System Wiring Configuration

The firmware in atmega2560.cpp should control 38 doors. Thes 38 doors are wired to 2 pcb's. The PCB's are identical. Board1 and Board2 are interconnected over UART1.

Only Board1 is connected to the internet via esp32. This esp32 is connected to the UART2 of Board1.

# GPIO Mapping

Note: Important abbrevations;
    dl_pin : door lock pin
    ds_pin : door statis pin
    cc_pin : charging control pin

## Board1 

Door 1: 
    dl_pin = 11
    ds_pin = 10
    cc_pin = 12

Door 2: 
    dl_pin = 8
    ds_pin = 7
    cc_pin = 9

Door 3: 
    dl_pin = 5
    ds_pin = 4
    cc_pin = 6

Door 4: 
    dl_pin = 2
    ds_pin = 20
    cc_pin = 3

Door 9: 
    dl_pin = 25
    ds_pin = 26
    cc_pin = 24

Door 10: 
    dl_pin = 28
    ds_pin = 29
    cc_pin = 27

Door 11: 
    dl_pin = 31
    ds_pin = 32
    cc_pin = 30

Door 12: 
    dl_pin = 34
    ds_pin = 35
    cc_pin = 33

Door 13: 
    dl_pin = 37
    ds_pin = 38
    cc_pin = 36

Door 19: 
    dl_pin = 40
    ds_pin = 41
    cc_pin = 39

Door 20: 
    dl_pin = 43
    ds_pin = 44
    cc_pin = 42


Door 21: 
    dl_pin = 47
    ds_pin = 48
    cc_pin = 46

Door 22: 
    dl_pin = 50
    ds_pin = 51
    cc_pin = 49


Door 23: 
    dl_pin = 53
    ds_pin = A15
    cc_pin = 52

Door 29: 
    dl_pin = A13
    ds_pin = A12
    cc_pin = A14

Door 30: 
    dl_pin = A10
    ds_pin = A9
    cc_pin = A11

Door 31: 
    dl_pin = A7
    ds_pin = A6
    cc_pin = A8

Door 32: 
    dl_pin = A4
    ds_pin = A3
    cc_pin = A5

Door 33: 
    dl_pin = A1
    ds_pin = A0
    cc_pin = A2

## Board2

Door 5: 
    dl_pin = 8
    ds_pin = 7
    cc_pin = 9

Door 6: 
    dl_pin = 5
    ds_pin = 4
    cc_pin = 6

Door 7: 
    dl_pin = 2
    ds_pin = 20
    cc_pin = 3

Door 8: 
    dl_pin = 22
    ds_pin = 23
    cc_pin = 21

Door 14: 
    dl_pin = 25
    ds_pin = 26
    cc_pin = 24

Door 15: 
    dl_pin = 28
    ds_pin = 29
    cc_pin = 27

Door 16: 
    dl_pin = 31
    ds_pin = 32
    cc_pin = 30

Door 17: 
    dl_pin = 34
    ds_pin = 35
    cc_pin = 33

Door 18: 
    dl_pin = 37
    ds_pin = 38
    cc_pin = 36

Door 24: 
    dl_pin = 40
    ds_pin = 41
    cc_pin = 39

Door 25: 
    dl_pin = 43
    ds_pin = 44
    cc_pin = 42

Door 26: 
    dl_pin = 47
    ds_pin = 48
    cc_pin = 46

Door 27: 
    dl_pin = 50
    ds_pin = 51
    cc_pin = 49


Door 28: 
    dl_pin = 53
    ds_pin = A15
    cc_pin = 52

Door 34: 
    dl_pin = A13
    ds_pin = A12
    cc_pin = A14


Door 35: 
    dl_pin = A10
    ds_pin = A9
    cc_pin = A11

Door 36: 
    dl_pin = A7
    ds_pin = A6
    cc_pin = A8


Door 37: 
    dl_pin = A4
    ds_pin = A3
    cc_pin = A5

Door 38: 
    dl_pin = A1
    ds_pin = A0
    cc_pin = A2




