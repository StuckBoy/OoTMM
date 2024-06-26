#include <combo.h>

/* Allow saving even if the owl statue is closed */
PATCH_START 0x80b92c14
  li t8,0xc01
PATCH_END

/* Use our own save handler */
PATCH_START 0x80b92e54
  jal ObjWarpstone_Save
   move a0,s0
PATCH_END

PATCH_START 0x80b92e68
  nop
PATCH_END

PATCH_START 0x80b92e74
  nop
PATCH_END

PATCH_START 0x80b92e80
  nop
PATCH_END

PATCH_START 0x80b92e94
  nop
PATCH_END

/* Hack: change bne to beq */
PATCH_START 0x80b92e4c
.byte 0x15
PATCH_END

/* Use our own handler */
PATCH_START 0x80b92c10
  lui a1,%HI(ObjWarpstone_GiveItem)
PATCH_END

PATCH_START 0x80b92c28
  addiu a1,%LO(ObjWarpstone_GiveItem)
PATCH_END

PATCH_START 0x80b932ac
.int 0
.int 0
PATCH_END
