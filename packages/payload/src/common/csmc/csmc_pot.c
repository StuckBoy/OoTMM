#include <combo.h>
#include <combo/csmc.h>
#include <combo/custom.h>

# define POT_TEX_NORMAL_SIDE    0x06000000
# define POT_TEX_NORMAL_TOP     0x06001000
# define POT_TEX_MAGIC_SIDE     0x060003e0
# define POT_TEX_MAGIC_TOP      0x060013e0

#if defined(GAME_OOT)
# define POT_TEX_NORMAL_DANGEON_SIDE    0x050108a0
# define POT_TEX_NORMAL_DANGEON_TOP     0x050118a0
#else
# define POT_TEX_NORMAL_DANGEON_SIDE    0x05010ec0
# define POT_TEX_NORMAL_DANGEON_TOP     0x05011ec0
#endif

typedef struct
{
    u32 custom:1;
    u32 segSide:31;
    u32 segTop;
}
CsmcPotData;

static const Gfx kTexNormalSide[] = {
    gsDPLoadTextureBlock(POT_TEX_NORMAL_SIDE, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static const Gfx kTexNormalTop[] = {
    gsDPLoadTextureBlock(POT_TEX_NORMAL_TOP, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static const Gfx kTexNormalDangeonSide[] = {
    gsDPLoadTextureBlock(POT_TEX_NORMAL_DANGEON_SIDE, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static const Gfx kTexNormalDangeonTop[] = {
    gsDPLoadTextureBlock(POT_TEX_NORMAL_DANGEON_TOP, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static const Gfx kTexMagicSide[] = {
#if defined(GAME_MM)
    gsDPLoadTextureBlock(POT_TEX_MAGIC_SIDE, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
#endif
};

static const Gfx kTexMagicTop[] = {
#if defined(GAME_MM)
    gsDPLoadTextureBlock(POT_TEX_MAGIC_TOP, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
#endif
};

static Gfx kTexMajorSide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexMajorTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexSpiderSide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexSpiderTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexFairySide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexFairyTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexKeySide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexKeyTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexHeartSide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexHeartTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexBossKeySide[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 32, 64, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 5, 6, 0, 0),
    gsSPEndDisplayList(),
};

static Gfx kTexBossKeyTop[] = {
    gsDPLoadTextureBlock(0, G_IM_FMT_RGBA, G_IM_SIZ_16b, 16, 16, 0, G_TX_WRAP | G_TX_NOMIRROR, G_TX_WRAP | G_TX_NOMIRROR, 4, 4, 0, 0),
    gsSPEndDisplayList(),
};

static const Gfx* const kTexSide[] = {
    kTexNormalSide,
    kTexNormalDangeonSide,
    kTexMagicSide,
    kTexMajorSide,
    kTexSpiderSide,
    kTexFairySide,
    kTexKeySide,
    kTexHeartSide,
    kTexBossKeySide,
};

static const Gfx* const kTexTop[] = {
    kTexNormalTop,
    kTexNormalDangeonTop,
    kTexMagicTop,
    kTexMajorTop,
    kTexSpiderTop,
    kTexFairyTop,
    kTexKeyTop,
    kTexHeartTop,
    kTexBossKeyTop,
};

static void patchTextureList(Gfx* gfx, u32 vaddr)
{
    u32 addr;

    addr = (u32)comboCacheGetFile(vaddr);
    if (addr)
        addr -= 0x80000000;
    gfx->words.w1 = addr;
}

static void loadTexture(int csmcPotId)
{
    switch (csmcPotId)
    {
    case CSMC_POT_MAJOR:
        patchTextureList(kTexMajorSide, CUSTOM_POTS_MAJOR_SIDE_VROM);
        patchTextureList(kTexMajorTop, CUSTOM_POTS_MAJOR_TOP_VROM);
        break;
    case CSMC_POT_SPIDER:
        patchTextureList(kTexSpiderSide, CUSTOM_POTS_SPIDER_SIDE_VROM);
        patchTextureList(kTexSpiderTop, CUSTOM_POTS_SPIDER_TOP_VROM);
        break;
    case CSMC_POT_FAIRY:
        patchTextureList(kTexFairySide, CUSTOM_POTS_FAIRY_SIDE_VROM);
        patchTextureList(kTexFairyTop, CUSTOM_POTS_FAIRY_TOP_VROM);
        break;
    case CSMC_POT_KEY:
        patchTextureList(kTexKeySide, CUSTOM_POTS_KEY_SIDE_VROM);
        patchTextureList(kTexKeyTop, CUSTOM_POTS_SPIDER_TOP_VROM);
        break;
    case CSMC_POT_HEART:
        patchTextureList(kTexHeartSide, CUSTOM_POTS_HEART_SIDE_VROM);
        patchTextureList(kTexHeartTop, CUSTOM_POTS_HEART_TOP_VROM);
        break;
    case CSMC_POT_BOSSKEY:
        patchTextureList(kTexBossKeySide, CUSTOM_POTS_BOSSKEY_SIDE_VROM);
        patchTextureList(kTexBossKeyTop, CUSTOM_POTS_BOSSKEY_TOP_VROM);
        break;
    }
}

static int csmcPotId(s16 gi, int def)
{
    int csmcId;

    if (gi == 0)
        return def;
    if (!csmcEnabled())
        return CSMC_POT_MAJOR;

    csmcId = csmcFromItem(gi);
    switch (csmcId)
    {
    case CSMC_NORMAL:       return def;
    case CSMC_MAJOR:        return CSMC_POT_MAJOR;
    case CSMC_KEY:          return CSMC_POT_KEY;
    case CSMC_SPIDER:       return CSMC_POT_SPIDER;
    case CSMC_FAIRY:        return CSMC_POT_FAIRY;
    case CSMC_HEART:        return CSMC_POT_HEART;
    case CSMC_BOSS_KEY:     return CSMC_POT_BOSSKEY;
    case CSMC_SOUL:         return CSMC_POT_BOSSKEY;
    default:                return CSMC_POT_MAJOR;
    }
}

void csmcPotPreDraw(Actor* this, GameState_Play* play, s16 gi, int def)
{
    int type;

    type = csmcPotId(gi, def);
    loadTexture(type);

    OPEN_DISPS(play->gs.gfx);
    gSPSegment(POLY_OPA_DISP++, 0x0a, kTexSide[type]);
    gSPSegment(POLY_OPA_DISP++, 0x0b, kTexTop[type]);
    CLOSE_DISPS();
}
