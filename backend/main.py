"""
Handahana / Kendaraya calculation microservice.

Computes a sidereal (Lahiri) Sri Lankan horoscope: Lagna, Rashi (D1) and
Navamsha (D9) charts with whole-sign houses, the birth Nakshatra (Upan Nakatha)
with pada, and the full Vimshottari Maha Dasha / Antar Dasha timeline.

Run:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
import threading
from datetime import date, datetime, timedelta, timezone
from typing import Literal
from zoneinfo import ZoneInfo

import swisseph as swe
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Constants & reference tables
# ---------------------------------------------------------------------------

COLOMBO = ZoneInfo("Asia/Colombo")
NAKSHATRA_SPAN = 360.0 / 27.0  # 13°20'
PADA_SPAN = NAKSHATRA_SPAN / 4.0  # 3°20'
NAVAMSHA_SPAN = 30.0 / 9.0  # 3°20'
DAYS_PER_YEAR = 365.25

# swisseph keeps global state (sidereal mode, ephemeris path); serialise access.
_SWE_LOCK = threading.Lock()

_EPHE_PATH = os.environ.get("SE_EPHE_PATH")
if _EPHE_PATH and os.path.isdir(_EPHE_PATH):
    swe.set_ephe_path(_EPHE_PATH)
    _EPHE_FLAG = swe.FLG_SWIEPH
else:
    # Built-in Moshier ephemeris: no data files needed, sub-arcsecond for planets.
    _EPHE_FLAG = swe.FLG_MOSEPH

CALC_FLAGS = _EPHE_FLAG | swe.FLG_SIDEREAL | swe.FLG_SPEED

PlanetKey = Literal[
    "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"
]

PLANETS: dict[str, dict] = {
    "sun": {"id": swe.SUN, "en": "Sun (Ravi)", "si": "රවි"},
    "moon": {"id": swe.MOON, "en": "Moon (Chandra)", "si": "චන්ද්‍ර"},
    "mars": {"id": swe.MARS, "en": "Mars (Kuja)", "si": "කුජ"},
    "mercury": {"id": swe.MERCURY, "en": "Mercury (Budha)", "si": "බුධ"},
    "jupiter": {"id": swe.JUPITER, "en": "Jupiter (Guru)", "si": "ගුරු"},
    "venus": {"id": swe.VENUS, "en": "Venus (Shukra)", "si": "ශුක්‍ර"},
    "saturn": {"id": swe.SATURN, "en": "Saturn (Shani)", "si": "ශනි"},
    # Sri Lankan almanacs traditionally use the mean lunar node.
    "rahu": {"id": swe.MEAN_NODE, "en": "Rahu", "si": "රාහු"},
    "ketu": {"id": None, "en": "Ketu", "si": "කේතු"},
}

RASHIS: list[dict] = [
    {"en": "Mesha (Aries)", "si": "මේෂ", "lord": "mars"},
    {"en": "Vrishabha (Taurus)", "si": "වෘෂභ", "lord": "venus"},
    {"en": "Mithuna (Gemini)", "si": "මිථුන", "lord": "mercury"},
    {"en": "Kataka (Cancer)", "si": "කටක", "lord": "moon"},
    {"en": "Simha (Leo)", "si": "සිංහ", "lord": "sun"},
    {"en": "Kanya (Virgo)", "si": "කන්‍යා", "lord": "mercury"},
    {"en": "Tula (Libra)", "si": "තුලා", "lord": "venus"},
    {"en": "Vrischika (Scorpio)", "si": "වෘශ්චික", "lord": "mars"},
    {"en": "Dhanu (Sagittarius)", "si": "ධනු", "lord": "jupiter"},
    {"en": "Makara (Capricorn)", "si": "මකර", "lord": "saturn"},
    {"en": "Kumbha (Aquarius)", "si": "කුම්භ", "lord": "saturn"},
    {"en": "Meena (Pisces)", "si": "මීන", "lord": "jupiter"},
]

# Sri Lankan (Sinhala) nakatha names alongside the Sanskrit/English forms.
NAKSHATRAS: list[dict] = [
    {"en": "Ashwini", "si": "අස්විද"},
    {"en": "Bharani", "si": "බෙරණ"},
    {"en": "Krittika", "si": "කැති"},
    {"en": "Rohini", "si": "රෙහෙණ"},
    {"en": "Mrigashira", "si": "මුවසිරස"},
    {"en": "Ardra", "si": "අද"},
    {"en": "Punarvasu", "si": "පුනාවස"},
    {"en": "Pushya", "si": "පුෂ"},
    {"en": "Ashlesha", "si": "අස්ලිස"},
    {"en": "Magha", "si": "මා"},
    {"en": "Purva Phalguni", "si": "පුවපල්"},
    {"en": "Uttara Phalguni", "si": "උත්‍රපල්"},
    {"en": "Hasta", "si": "හත"},
    {"en": "Chitra", "si": "සිත"},
    {"en": "Swati", "si": "සා"},
    {"en": "Vishakha", "si": "විසා"},
    {"en": "Anuradha", "si": "අනුර"},
    {"en": "Jyeshtha", "si": "දෙට"},
    {"en": "Mula", "si": "මුල"},
    {"en": "Purva Ashadha", "si": "පුවසල"},
    {"en": "Uttara Ashadha", "si": "උත්‍රසල"},
    {"en": "Shravana", "si": "සුවණ"},
    {"en": "Dhanishta", "si": "දෙනට"},
    {"en": "Shatabhisha", "si": "සියාවස"},
    {"en": "Purva Bhadrapada", "si": "පුවපුටුප"},
    {"en": "Uttara Bhadrapada", "si": "උත්‍රපුටුප"},
    {"en": "Revati", "si": "රේවතී"},
]

# Vimshottari order starting from Ashwini's lord, with Maha Dasha lengths (years).
VIMSHOTTARI: list[tuple[str, int]] = [
    ("ketu", 7),
    ("venus", 20),
    ("sun", 6),
    ("moon", 10),
    ("mars", 7),
    ("rahu", 18),
    ("jupiter", 16),
    ("saturn", 19),
    ("mercury", 17),
]
VIMSHOTTARI_TOTAL = 120

EXALTATION = {
    "sun": 0, "moon": 1, "mars": 9, "mercury": 5, "jupiter": 3,
    "venus": 11, "saturn": 6, "rahu": 1, "ketu": 7,
}
OWN_SIGNS = {
    "sun": {4}, "moon": {3}, "mars": {0, 7}, "mercury": {2, 5},
    "jupiter": {8, 11}, "venus": {1, 6}, "saturn": {9, 10},
    "rahu": set(), "ketu": set(),
}

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class BirthRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    gender: Literal["male", "female", "other"]
    year: int = Field(ge=1900, le=2100)
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    hour: int = Field(ge=0, le=23, description="24-hour local Sri Lanka clock time")
    minute: int = Field(ge=0, le=59)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    place: str | None = Field(default=None, max_length=120)
    as_of: date | None = Field(
        default=None, description="Reference date for the 'current' dasha (defaults to today in Colombo)"
    )

    @model_validator(mode="after")
    def _valid_calendar_date(self) -> "BirthRequest":
        try:
            date(self.year, self.month, self.day)
        except ValueError as exc:
            raise ValueError(f"Invalid calendar date: {exc}") from exc
        return self


class Bilingual(BaseModel):
    en: str
    si: str


class NakshatraInfo(BaseModel):
    index: int
    name: Bilingual
    pada: int
    lord: str
    degree_in_nakshatra: float
    fraction_elapsed: float


class PlanetPosition(BaseModel):
    key: str
    name: Bilingual
    longitude: float
    rashi_index: int
    rashi: Bilingual
    degree_in_sign: float
    house: int
    navamsha_rashi_index: int
    navamsha_house: int
    retrograde: bool
    dignity: Literal["exalted", "debilitated", "own", "neutral"]
    nakshatra: NakshatraInfo


class LagnaInfo(BaseModel):
    longitude: float
    rashi_index: int
    rashi: Bilingual
    degree_in_sign: float
    lord: str
    nakshatra: NakshatraInfo
    navamsha_rashi_index: int
    navamsha_rashi: Bilingual
    navamsha_lord: str


class HouseBox(BaseModel):
    house: int
    rashi_index: int
    rashi: Bilingual
    occupants: list[str]


class ChartGrid(BaseModel):
    lagna_rashi_index: int
    houses: list[HouseBox]


class DashaPeriod(BaseModel):
    lord: str
    name: Bilingual
    start: date
    end: date
    years: float
    is_current: bool


class MahaDasha(DashaPeriod):
    antar_dashas: list[DashaPeriod]


class DashaBalance(BaseModel):
    lord: str
    years: int
    months: int
    days: int
    total_years: float


class DashaInfo(BaseModel):
    as_of: date
    birth_balance: DashaBalance
    maha_dashas: list[MahaDasha]
    current_maha: DashaPeriod | None
    current_antar: DashaPeriod | None


class BirthInfo(BaseModel):
    name: str
    gender: str
    place: str | None
    lat: float
    lon: float
    local_datetime: str
    utc_datetime: str
    utc_offset: str


class TransitSnapshot(BaseModel):
    key: str
    rashi_index: int
    rashi: Bilingual
    retrograde: bool
    house_from_moon: int
    house_from_lagna: int


class ApalaItem(BaseModel):
    key: str
    planet: str
    severity: Literal["high", "medium"]
    title: Bilingual
    detail: Bilingual


class ApalaInfo(BaseModel):
    as_of: date
    saturn: TransitSnapshot
    rahu: TransitSnapshot
    items: list[ApalaItem]
    active: bool


class ChartResponse(BaseModel):
    birth: BirthInfo
    julian_day_ut: float
    ayanamsha: float
    ayanamsha_name: str
    ephemeris: str
    lagna: LagnaInfo
    moon_sign: HouseBox
    rashi_lord: str
    nakshatra: NakshatraInfo
    planets: list[PlanetPosition]
    rashi_chart: ChartGrid
    navamsha_chart: ChartGrid
    dasha: DashaInfo
    apala: ApalaInfo


# ---------------------------------------------------------------------------
# Astrological helpers
# ---------------------------------------------------------------------------


def norm360(value: float) -> float:
    return value % 360.0


def rashi_of(longitude: float) -> int:
    return int(norm360(longitude) // 30) % 12


def navamsha_of(longitude: float) -> int:
    """D9 sign: each 3°20' segment of the zodiac advances one sign from Aries.

    This continuous form reproduces the classical rule (movable signs start
    from themselves, fixed signs from the 9th, dual signs from the 5th).
    """
    return int(norm360(longitude) // NAVAMSHA_SPAN) % 12


def whole_sign_house(sign_index: int, lagna_index: int) -> int:
    return ((sign_index - lagna_index) % 12) + 1


def bilingual_rashi(index: int) -> Bilingual:
    return Bilingual(en=RASHIS[index]["en"], si=RASHIS[index]["si"])


def bilingual_planet(key: str) -> Bilingual:
    return Bilingual(en=PLANETS[key]["en"], si=PLANETS[key]["si"])


def nakshatra_of(longitude: float) -> NakshatraInfo:
    lon = norm360(longitude)
    index = int(lon // NAKSHATRA_SPAN) % 27
    within = lon - index * NAKSHATRA_SPAN
    pada = min(int(within // PADA_SPAN) + 1, 4)
    return NakshatraInfo(
        index=index,
        name=Bilingual(**NAKSHATRAS[index]),
        pada=pada,
        lord=VIMSHOTTARI[index % 9][0],
        degree_in_nakshatra=round(within, 6),
        fraction_elapsed=round(within / NAKSHATRA_SPAN, 8),
    )


def dignity_of(key: str, sign_index: int) -> str:
    if EXALTATION[key] == sign_index:
        return "exalted"
    if (EXALTATION[key] + 6) % 12 == sign_index:
        return "debilitated"
    if sign_index in OWN_SIGNS[key]:
        return "own"
    return "neutral"


def build_chart(lagna_index: int, placements: dict[str, int]) -> ChartGrid:
    houses: list[HouseBox] = []
    for offset in range(12):
        sign = (lagna_index + offset) % 12
        occupants = [key for key, s in placements.items() if s == sign]
        houses.append(
            HouseBox(
                house=offset + 1,
                rashi_index=sign,
                rashi=bilingual_rashi(sign),
                occupants=occupants,
            )
        )
    return ChartGrid(lagna_rashi_index=lagna_index, houses=houses)


def add_years(moment: datetime, years: float) -> datetime:
    return moment + timedelta(days=years * DAYS_PER_YEAR)


def split_years(years: float) -> tuple[int, int, int]:
    """Express a dasha balance as traditional years / months / days."""
    total_days = years * DAYS_PER_YEAR
    whole_years = int(years)
    remaining_days = total_days - whole_years * DAYS_PER_YEAR
    months = int(remaining_days // (DAYS_PER_YEAR / 12))
    days = int(round(remaining_days - months * (DAYS_PER_YEAR / 12)))
    if days >= 30:
        months, days = months + 1, 0
    if months >= 12:
        whole_years, months = whole_years + 1, 0
    return whole_years, months, days


def vimshottari(moon_longitude: float, birth_local: datetime, as_of: date) -> DashaInfo:
    nak = nakshatra_of(moon_longitude)
    start_idx = nak.index % 9
    first_lord, first_years = VIMSHOTTARI[start_idx]

    elapsed_years = first_years * nak.fraction_elapsed
    balance_years = first_years - elapsed_years
    # Theoretical start of the birth Maha Dasha (before birth); used so that
    # Antar Dasha boundaries inside the first Maha Dasha are exact.
    cycle_start = add_years(birth_local, -elapsed_years)

    maha_dashas: list[MahaDasha] = []
    current_maha: DashaPeriod | None = None
    current_antar: DashaPeriod | None = None

    cursor = cycle_start
    # One full 120-year cycle, plus the next dasha so lifespans past 120 are covered.
    for step in range(10):
        lord, years = VIMSHOTTARI[(start_idx + step) % 9]
        maha_start, maha_end = cursor, add_years(cursor, years)

        antars: list[DashaPeriod] = []
        a_cursor = maha_start
        lord_pos = [l for l, _ in VIMSHOTTARI].index(lord)
        for sub in range(9):
            sub_lord, sub_years_full = VIMSHOTTARI[(lord_pos + sub) % 9]
            sub_years = years * sub_years_full / VIMSHOTTARI_TOTAL
            a_start, a_end = a_cursor, add_years(a_cursor, sub_years)
            a_cursor = a_end
            if a_end <= birth_local:
                continue  # sub-period completed before birth
            shown_start = max(a_start, birth_local)
            is_cur = shown_start.date() <= as_of < a_end.date()
            period = DashaPeriod(
                lord=sub_lord,
                name=bilingual_planet(sub_lord),
                start=shown_start.date(),
                end=a_end.date(),
                years=round((a_end - shown_start).days / DAYS_PER_YEAR, 4),
                is_current=is_cur,
            )
            antars.append(period)
            if is_cur:
                current_antar = period

        shown_start = max(maha_start, birth_local)
        is_current = shown_start.date() <= as_of < maha_end.date()
        maha = MahaDasha(
            lord=lord,
            name=bilingual_planet(lord),
            start=shown_start.date(),
            end=maha_end.date(),
            years=round(balance_years if step == 0 else float(years), 4),
            is_current=is_current,
            antar_dashas=antars,
        )
        maha_dashas.append(maha)
        if is_current:
            current_maha = DashaPeriod(**maha.model_dump(exclude={"antar_dashas"}))
        cursor = maha_end

    y, m, d = split_years(balance_years)
    return DashaInfo(
        as_of=as_of,
        birth_balance=DashaBalance(
            lord=first_lord, years=y, months=m, days=d, total_years=round(balance_years, 6)
        ),
        maha_dashas=maha_dashas,
        current_maha=current_maha,
        current_antar=current_antar,
    )


def format_offset(delta: timedelta | None) -> str:
    if delta is None:
        return "+00:00"
    total = int(delta.total_seconds())
    sign = "+" if total >= 0 else "-"
    total = abs(total)
    return f"{sign}{total // 3600:02d}:{(total % 3600) // 60:02d}"


# ---------------------------------------------------------------------------
# Core calculation
# ---------------------------------------------------------------------------


def calculate_chart(req: BirthRequest) -> ChartResponse:
    # 1. Local Sri Lanka civil time -> UTC using the historical tz database.
    #    Handles the 1996-2006 changes (+06:30 / +06:00 / +05:30) and older eras.
    local_dt = datetime(req.year, req.month, req.day, req.hour, req.minute, tzinfo=COLOMBO)
    utc_dt = local_dt.astimezone(timezone.utc)
    hour_fraction = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0

    with _SWE_LOCK:
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        jd_ut = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour_fraction, swe.GREG_CAL)
        ayanamsha = swe.get_ayanamsa_ut(jd_ut)

        # 2. Sidereal ascendant (house system is irrelevant for ascmc[0]).
        _cusps, ascmc = swe.houses_ex(jd_ut, req.lat, req.lon, b"W", swe.FLG_SIDEREAL)
        lagna_lon = norm360(ascmc[0])

        raw: dict[str, tuple[float, float]] = {}
        for key, meta in PLANETS.items():
            if meta["id"] is None:
                continue
            xx, _ret = swe.calc_ut(jd_ut, meta["id"], CALC_FLAGS)
            raw[key] = (norm360(xx[0]), xx[3])
        rahu_lon, rahu_speed = raw["rahu"]
        raw["ketu"] = (norm360(rahu_lon + 180.0), rahu_speed)

    lagna_idx = rashi_of(lagna_lon)
    lagna_nav_idx = navamsha_of(lagna_lon)

    planets: list[PlanetPosition] = []
    d1: dict[str, int] = {}
    d9: dict[str, int] = {}
    for key, (lon, speed) in raw.items():
        sign = rashi_of(lon)
        nav = navamsha_of(lon)
        d1[key], d9[key] = sign, nav
        planets.append(
            PlanetPosition(
                key=key,
                name=bilingual_planet(key),
                longitude=round(lon, 6),
                rashi_index=sign,
                rashi=bilingual_rashi(sign),
                degree_in_sign=round(lon % 30, 6),
                house=whole_sign_house(sign, lagna_idx),
                navamsha_rashi_index=nav,
                navamsha_house=whole_sign_house(nav, lagna_nav_idx),
                # Nodes are always treated as retrograde in Jyotisha.
                retrograde=True if key in ("rahu", "ketu") else speed < 0,
                dignity=dignity_of(key, sign),
                nakshatra=nakshatra_of(lon),
            )
        )

    rashi_chart = build_chart(lagna_idx, d1)
    navamsha_chart = build_chart(lagna_nav_idx, d9)

    moon_lon = raw["moon"][0]
    moon_sign_idx = rashi_of(moon_lon)
    moon_house = rashi_chart.houses[whole_sign_house(moon_sign_idx, lagna_idx) - 1]

    as_of = req.as_of or datetime.now(COLOMBO).date()

    return ChartResponse(
        birth=BirthInfo(
            name=req.name.strip(),
            gender=req.gender,
            place=req.place,
            lat=req.lat,
            lon=req.lon,
            local_datetime=local_dt.isoformat(),
            utc_datetime=utc_dt.isoformat(),
            utc_offset=format_offset(local_dt.utcoffset()),
        ),
        julian_day_ut=round(jd_ut, 8),
        ayanamsha=round(ayanamsha, 6),
        ayanamsha_name="Lahiri (Chitrapaksha)",
        ephemeris="Swiss Ephemeris" if _EPHE_FLAG == swe.FLG_SWIEPH else "Moshier (built-in)",
        lagna=LagnaInfo(
            longitude=round(lagna_lon, 6),
            rashi_index=lagna_idx,
            rashi=bilingual_rashi(lagna_idx),
            degree_in_sign=round(lagna_lon % 30, 6),
            lord=RASHIS[lagna_idx]["lord"],
            nakshatra=nakshatra_of(lagna_lon),
            navamsha_rashi_index=lagna_nav_idx,
            navamsha_rashi=bilingual_rashi(lagna_nav_idx),
            navamsha_lord=RASHIS[lagna_nav_idx]["lord"],
        ),
        moon_sign=moon_house,
        rashi_lord=RASHIS[moon_sign_idx]["lord"],
        nakshatra=nakshatra_of(moon_lon),
        planets=planets,
        rashi_chart=rashi_chart,
        navamsha_chart=navamsha_chart,
        dasha=vimshottari(moon_lon, local_dt, as_of),
        apala=calculate_apala(moon_sign_idx, lagna_idx, as_of),
    )


# ---------------------------------------------------------------------------
# Daily transits (Gocharaya) & Panchanga for Sri Lanka
# ---------------------------------------------------------------------------

# Panchanga times are given for Colombo, as in most Sri Lankan almanacs.
COLOMBO_GEOPOS = (79.8612, 6.9271, 0.0)

WEEKDAYS: list[dict] = [  # index 0 = Sunday
    {"en": "Sunday", "si": "ඉරිදා"},
    {"en": "Monday", "si": "සඳුදා"},
    {"en": "Tuesday", "si": "අඟහරුවාදා"},
    {"en": "Wednesday", "si": "බදාදා"},
    {"en": "Thursday", "si": "බ්‍රහස්පතින්දා"},
    {"en": "Friday", "si": "සිකුරාදා"},
    {"en": "Saturday", "si": "සෙනසුරාදා"},
]
WEEKDAY_LORDS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]

# Which eighth of the daytime (sunrise→sunset) is Rahu Kalaya, by weekday (Sunday first).
RAHU_KALAYA_PART = [8, 2, 7, 5, 6, 4, 3]

DIRECTIONS: dict[str, dict] = {
    "N": {"en": "North", "si": "උතුර"},
    "NE": {"en": "North-East", "si": "ඊසාන"},
    "E": {"en": "East", "si": "නැගෙනහිර"},
    "SE": {"en": "South-East", "si": "ගිනිකොන"},
    "S": {"en": "South", "si": "දකුණ"},
    "SW": {"en": "South-West", "si": "නිරිත"},
    "W": {"en": "West", "si": "බටහිර"},
    "NW": {"en": "North-West", "si": "වයඹ"},
}
OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E", "NE": "SW", "SW": "NE", "SE": "NW", "NW": "SE"}

# මරු සූලම (Disha Shoola): direction to avoid setting out towards, by weekday (Sunday first).
# Sun & Fri: West · Mon & Sat: East · Tue & Wed: North · Thu: South.
MARU_SOOLAMA = ["W", "E", "N", "N", "S", "W", "E"]
# සුබ දිශාව for the day: the direction opposite the Maru Soolama. Edit here to follow a different lithaya.
SUBA_DISHAWA = [OPPOSITE[code] for code in MARU_SOOLAMA]


class TimeWindow(BaseModel):
    start: datetime
    end: datetime


class TransitPlanet(BaseModel):
    key: str
    name: Bilingual
    longitude: float
    rashi_index: int
    rashi: Bilingual
    degree_in_sign: float
    retrograde: bool
    nakshatra: NakshatraInfo


class Direction(BaseModel):
    code: str
    name: Bilingual


def direction(code: str) -> Direction:
    return Direction(code=code, name=Bilingual(**DIRECTIONS[code]))


class DailyTransits(BaseModel):
    date: date
    weekday_index: int = Field(description="0 = Sunday")
    weekday: Bilingual
    weekday_lord: str
    location: str
    sunrise: datetime
    sunset: datetime
    rahu_kalaya: TimeWindow
    maru_soolama: Direction
    suba_dishawa: Direction
    reference_time: datetime = Field(description="Positions are computed at sunrise, as in the Sri Lankan panchanga")
    ayanamsha: float
    nakshatra: NakshatraInfo
    nakshatra_ends_at: datetime | None
    next_nakshatra: Bilingual | None
    moon: TransitPlanet
    moon_sign_changes_at: datetime | None
    next_moon_rashi_index: int | None
    planets: list[TransitPlanet]


def jd_to_local(jd_ut: float) -> datetime:
    y, m, d, hours = swe.revjul(jd_ut, swe.GREG_CAL)
    utc = datetime(y, m, d, tzinfo=timezone.utc) + timedelta(hours=hours)
    return utc.astimezone(COLOMBO).replace(microsecond=0)


def local_to_jd(moment: datetime) -> float:
    utc = moment.astimezone(timezone.utc)
    return swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60 + utc.second / 3600, swe.GREG_CAL)


def _sun_event(jd_start: float, rsmi: int) -> float:
    res, tret = swe.rise_trans(jd_start, swe.SUN, rsmi, COLOMBO_GEOPOS, 0.0, 0.0, _EPHE_FLAG)
    if res != 0:
        raise swe.Error("Sun rise/set not found")
    return tret[0]


def _moon_longitude(jd_ut: float) -> float:
    xx, _ = swe.calc_ut(jd_ut, swe.MOON, CALC_FLAGS)
    return norm360(xx[0])


def _next_change(jd_from: float, jd_to: float, index_of) -> float | None:
    """First moment in (jd_from, jd_to] where index_of(moon longitude) changes; hourly scan + bisection."""
    start_idx = index_of(_moon_longitude(jd_from))
    step = 1 / 24
    lo = jd_from
    while lo < jd_to:
        hi = min(lo + step, jd_to)
        if index_of(_moon_longitude(hi)) != start_idx:
            for _ in range(30):  # ~0.1 s precision
                mid = (lo + hi) / 2
                if index_of(_moon_longitude(mid)) == start_idx:
                    lo = mid
                else:
                    hi = mid
            return hi
        lo = hi
    return None


def calculate_daily_transits(day: date) -> DailyTransits:
    midnight = datetime(day.year, day.month, day.day, tzinfo=COLOMBO)

    with _SWE_LOCK:
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        jd_midnight = local_to_jd(midnight)
        jd_sunrise = _sun_event(jd_midnight, swe.CALC_RISE)
        jd_sunset = _sun_event(jd_sunrise, swe.CALC_SET)
        jd_next_sunrise = _sun_event(jd_sunset, swe.CALC_RISE)
        ayanamsha = swe.get_ayanamsa_ut(jd_sunrise)

        raw: dict[str, tuple[float, float]] = {}
        for key, meta in PLANETS.items():
            if meta["id"] is None:
                continue
            xx, _ = swe.calc_ut(jd_sunrise, meta["id"], CALC_FLAGS)
            raw[key] = (norm360(xx[0]), xx[3])
        raw["ketu"] = (norm360(raw["rahu"][0] + 180.0), raw["rahu"][1])

        # Changes within this Panchanga day (sunrise to next sunrise).
        nak_end = _next_change(jd_sunrise, jd_next_sunrise, lambda lon: int(lon // NAKSHATRA_SPAN))
        sign_change = _next_change(jd_sunrise, jd_next_sunrise, rashi_of)
        next_sign = rashi_of(_moon_longitude(sign_change + 1e-4)) if sign_change else None

    planets = [
        TransitPlanet(
            key=key,
            name=bilingual_planet(key),
            longitude=round(lon, 6),
            rashi_index=rashi_of(lon),
            rashi=bilingual_rashi(rashi_of(lon)),
            degree_in_sign=round(lon % 30, 6),
            retrograde=True if key in ("rahu", "ketu") else speed < 0,
            nakshatra=nakshatra_of(lon),
        )
        for key, (lon, speed) in raw.items()
    ]
    moon = next(p for p in planets if p.key == "moon")

    sunrise, sunset = jd_to_local(jd_sunrise), jd_to_local(jd_sunset)
    weekday_index = (day.weekday() + 1) % 7  # Python: Monday=0 -> Sunday-first index
    part = (sunset - sunrise) / 8
    rahu_start = sunrise + part * (RAHU_KALAYA_PART[weekday_index] - 1)

    next_nak_index = (moon.nakshatra.index + 1) % 27
    return DailyTransits(
        date=day,
        weekday_index=weekday_index,
        weekday=Bilingual(**WEEKDAYS[weekday_index]),
        weekday_lord=WEEKDAY_LORDS[weekday_index],
        location="Colombo",
        sunrise=sunrise,
        sunset=sunset,
        rahu_kalaya=TimeWindow(start=rahu_start.replace(microsecond=0), end=(rahu_start + part).replace(microsecond=0)),
        maru_soolama=direction(MARU_SOOLAMA[weekday_index]),
        suba_dishawa=direction(SUBA_DISHAWA[weekday_index]),
        reference_time=sunrise,
        ayanamsha=round(ayanamsha, 6),
        nakshatra=moon.nakshatra,
        nakshatra_ends_at=jd_to_local(nak_end) if nak_end else None,
        next_nakshatra=Bilingual(**NAKSHATRAS[next_nak_index]) if nak_end else None,
        moon=moon,
        moon_sign_changes_at=jd_to_local(sign_change) if sign_change else None,
        next_moon_rashi_index=next_sign,
        planets=planets,
    )


# ---------------------------------------------------------------------------
# Apala: Saturn (Erashtaka / Ashtama) and Rahu transits against the natal chart
# ---------------------------------------------------------------------------


def _transit_snapshot(key: str, jd_ut: float, moon_sign: int, lagna_sign: int) -> TransitSnapshot:
    xx, _ = swe.calc_ut(jd_ut, PLANETS[key]["id"], CALC_FLAGS)
    sign = rashi_of(xx[0])
    return TransitSnapshot(
        key=key,
        rashi_index=sign,
        rashi=bilingual_rashi(sign),
        retrograde=True if key == "rahu" else xx[3] < 0,
        house_from_moon=whole_sign_house(sign, moon_sign),
        house_from_lagna=whole_sign_house(sign, lagna_sign),
    )


SATURN_FROM_MOON: dict[int, tuple[str, str, Bilingual, Bilingual]] = {
    12: (
        "erashtaka_first",
        "high",
        Bilingual(en="Senasuru Erashtaka — first phase", si="සෙනසුරු ඒරාෂ්ටකය — පළමු අවධිය"),
        Bilingual(
            en="Saturn is transiting the 12th sign from your Janma Rashi, opening the 7½-year Erashtaka. Expenses, travel and sleep may be affected.",
            si="ශනි ඔබේ ජන්ම රාශියෙන් දොළොස්වැන්නේ ගමන් කරන බැවින් අවුරුදු හත හමාරක ඒරාෂ්ටකය ආරම්භ වී ඇත. වියදම්, ගමන් බිමන් සහ නින්දට බලපෑම් ඇති විය හැක.",
        ),
    ),
    1: (
        "janma_shani",
        "high",
        Bilingual(en="Janma Shani — peak of the Erashtaka", si="ජන්ම ශනි — ඒරාෂ්ටකයේ මැද අවධිය"),
        Bilingual(
            en="Saturn is passing over your Janma Rashi, the most demanding part of the Erashtaka. Health, mental peace and responsibilities need care.",
            si="ශනි ඔබේ ජන්ම රාශිය මතින් ගමන් කරයි; මෙය ඒරාෂ්ටකයේ වඩාත් බරපතල කාලයයි. සෞඛ්‍යය, සිතේ සැනසීම සහ වගකීම් ගැන සැලකිලිමත් විය යුතුය.",
        ),
    ),
    2: (
        "erashtaka_last",
        "medium",
        Bilingual(en="Senasuru Erashtaka — final phase", si="සෙනසුරු ඒරාෂ්ටකය — අවසන් අවධිය"),
        Bilingual(
            en="Saturn is in the 2nd sign from your Janma Rashi, the closing phase of the Erashtaka. Family finances and speech need care.",
            si="ශනි ඔබේ ජන්ම රාශියෙන් දෙවැන්නේ සිටින බැවින් ඒරාෂ්ටකයේ අවසන් අවධිය ගත වේ. පවුලේ මුදල් කටයුතු සහ වචන භාවිතය ගැන සැලකිලිමත් වන්න.",
        ),
    ),
    8: (
        "ashtama_shani",
        "high",
        Bilingual(en="Ashtama Shani", si="අෂ්ටම ශනි"),
        Bilingual(
            en="Saturn is transiting the 8th sign from your Janma Rashi. Obstacles, delays and health matters call for patience and remedies.",
            si="ශනි ඔබේ ජන්ම රාශියෙන් අටවැන්නේ ගමන් කරයි. බාධක, ප්‍රමාද සහ සෞඛ්‍ය කරුණු සඳහා ඉවසීම සහ ශාන්තිකර්ම වැදගත් වේ.",
        ),
    ),
}

SATURN_FROM_LAGNA: dict[int, tuple[str, str, Bilingual, Bilingual]] = {
    1: (
        "lagna_shani",
        "medium",
        Bilingual(en="Saturn over the Lagna", si="ලග්නය මතින් ශනි ගමන"),
        Bilingual(
            en="Saturn is transiting your Lagna, which can bring fatigue and a heavier workload.",
            si="ශනි ඔබේ ලග්නය මතින් ගමන් කරන බැවින් වෙහෙස සහ වැඩ බර වැඩි විය හැක.",
        ),
    ),
    8: (
        "lagna_ashtama_shani",
        "medium",
        Bilingual(en="Saturn in the 8th from Lagna", si="ලග්නයෙන් අටවැන්නේ ශනි"),
        Bilingual(
            en="Saturn is in the 8th house from your Lagna; avoid unnecessary risks and look after your health.",
            si="ශනි ඔබේ ලග්නයෙන් අටවැන්නේ සිටින බැවින් අනවශ්‍ය අවදානම්වලින් වළකින්න; සෞඛ්‍යය ගැන සැලකිලිමත් වන්න.",
        ),
    ),
}


def calculate_apala(moon_sign: int, lagna_sign: int, as_of: date) -> ApalaInfo:
    noon = datetime(as_of.year, as_of.month, as_of.day, 12, tzinfo=COLOMBO)
    with _SWE_LOCK:
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        jd = local_to_jd(noon)
        saturn = _transit_snapshot("saturn", jd, moon_sign, lagna_sign)
        rahu = _transit_snapshot("rahu", jd, moon_sign, lagna_sign)

    items: list[ApalaItem] = []
    for table, house in ((SATURN_FROM_MOON, saturn.house_from_moon), (SATURN_FROM_LAGNA, saturn.house_from_lagna)):
        if house in table:
            key, severity, title, detail = table[house]
            items.append(ApalaItem(key=key, planet="saturn", severity=severity, title=title, detail=detail))

    if rahu.house_from_moon in (1, 8) or rahu.house_from_lagna in (1, 8):
        where_en = []
        where_si = []
        if rahu.house_from_moon in (1, 8):
            where_en.append(f"{'over' if rahu.house_from_moon == 1 else 'the 8th from'} your Janma Rashi")
            where_si.append("ජන්ම රාශිය මත" if rahu.house_from_moon == 1 else "ජන්ම රාශියෙන් අටවැන්නේ")
        if rahu.house_from_lagna in (1, 8):
            where_en.append(f"{'over' if rahu.house_from_lagna == 1 else 'the 8th from'} your Lagna")
            where_si.append("ලග්නය මත" if rahu.house_from_lagna == 1 else "ලග්නයෙන් අටවැන්නේ")
        items.append(
            ApalaItem(
                key="rahu_transit",
                planet="rahu",
                severity="medium",
                title=Bilingual(en="Difficult Rahu transit", si="අපහසු රාහු ගෝචරය"),
                detail=Bilingual(
                    en=f"Rahu is transiting {' and '.join(where_en)}, which can bring confusion, sudden changes and worry.",
                    si=f"රාහු {' සහ '.join(where_si)} ගමන් කරන බැවින් ව්‍යාකූලතා, හදිසි වෙනස්කම් සහ කනස්සලු ඇති විය හැක.",
                ),
            )
        )

    return ApalaInfo(as_of=as_of, saturn=saturn, rahu=rahu, items=items, active=bool(items))


# ---------------------------------------------------------------------------
# Porondam (marriage compatibility)
#
# Only porondam with well-established classical rules are calculated. The rule
# tables below are data, so further porondam can be added from a trusted lithaya.
# Counts run from the bride's nakshatra / rashi to the groom's (inclusive).
# ---------------------------------------------------------------------------

GANA = {  # 0 = Deva, 1 = Manushya, 2 = Rakshasa
    **{i: 0 for i in (0, 4, 6, 7, 12, 14, 16, 21, 26)},
    **{i: 1 for i in (1, 3, 5, 10, 11, 19, 20, 24, 25)},
    **{i: 2 for i in (2, 8, 9, 13, 15, 17, 18, 22, 23)},
}
GANA_NAMES = [
    Bilingual(en="Deva", si="දේව"),
    Bilingual(en="Manushya", si="මනුෂ්‍ය"),
    Bilingual(en="Rakshasa", si="රාක්ෂ"),
]

YONI = [  # animal per nakshatra
    "horse", "elephant", "sheep", "serpent", "serpent", "dog", "cat", "sheep", "cat",
    "rat", "rat", "cow", "buffalo", "tiger", "buffalo", "tiger", "deer", "deer",
    "dog", "monkey", "mongoose", "monkey", "lion", "horse", "lion", "cow", "elephant",
]
YONI_NAMES = {
    "horse": Bilingual(en="Horse", si="අශ්ව"),
    "elephant": Bilingual(en="Elephant", si="ඇත්"),
    "sheep": Bilingual(en="Sheep", si="එළු"),
    "serpent": Bilingual(en="Serpent", si="සර්ප"),
    "dog": Bilingual(en="Dog", si="සුනඛ"),
    "cat": Bilingual(en="Cat", si="බළල්"),
    "rat": Bilingual(en="Rat", si="මූෂික"),
    "cow": Bilingual(en="Cow", si="ගව"),
    "buffalo": Bilingual(en="Buffalo", si="මී ගව"),
    "tiger": Bilingual(en="Tiger", si="ව්‍යාඝ්‍ර"),
    "deer": Bilingual(en="Deer", si="මුව"),
    "monkey": Bilingual(en="Monkey", si="වානර"),
    "mongoose": Bilingual(en="Mongoose", si="මුගටි"),
    "lion": Bilingual(en="Lion", si="සිංහ"),
}
YONI_ENEMIES = {
    frozenset(p)
    for p in [("horse", "buffalo"), ("elephant", "lion"), ("sheep", "monkey"), ("serpent", "mongoose"),
              ("dog", "deer"), ("cat", "rat"), ("cow", "tiger")]
}

RAJJU = {  # body part groups
    **{i: 0 for i in (0, 8, 9, 17, 18, 26)},    # Pada (feet)
    **{i: 1 for i in (1, 7, 10, 16, 19, 25)},   # Kati (waist)
    **{i: 2 for i in (2, 6, 11, 15, 20, 24)},   # Nabhi (navel)
    **{i: 3 for i in (3, 5, 12, 14, 21, 23)},   # Kantha (neck)
    **{i: 4 for i in (4, 13, 22)},              # Shiro (head)
}
RAJJU_NAMES = [
    Bilingual(en="Pada (feet)", si="පාද"),
    Bilingual(en="Kati (waist)", si="කටි"),
    Bilingual(en="Nabhi (navel)", si="නාභි"),
    Bilingual(en="Kantha (neck)", si="කණ්ඨ"),
    Bilingual(en="Shiro (head)", si="ශිරෝ"),
]

VEDHA_PAIRS = {
    frozenset(p)
    for p in [(0, 17), (1, 16), (2, 15), (3, 14), (5, 21), (6, 20), (7, 19), (8, 18), (9, 26),
              (10, 25), (11, 24), (12, 23), (4, 22), (4, 13), (13, 22)]
}

NADI = {
    **{i: 0 for i in (0, 5, 6, 11, 12, 17, 18, 23, 24)},   # Aadi (Vata)
    **{i: 1 for i in (1, 4, 7, 10, 13, 16, 19, 22, 25)},   # Madhya (Pitta)
    **{i: 2 for i in (2, 3, 8, 9, 14, 15, 20, 21, 26)},    # Antya (Kapha)
}
NADI_NAMES = [
    Bilingual(en="Aadi (Vata)", si="ආදි (වාත)"),
    Bilingual(en="Madhya (Pitta)", si="මධ්‍ය (පිත්ත)"),
    Bilingual(en="Antya (Kapha)", si="අන්ත්‍ය (සෙම්)"),
]

VASHYA = {  # rashi -> rashis under its influence
    0: {4, 7}, 1: {3, 6}, 2: {5}, 3: {7, 8}, 4: {6}, 5: {2, 11},
    6: {5, 9}, 7: {3}, 8: {11}, 9: {0, 10}, 10: {0}, 11: {9},
}

VARNA = {  # 3 = Brahmana ... 0 = Shudra, by Moon rashi
    3: 3, 7: 3, 11: 3,
    0: 2, 4: 2, 8: 2,
    1: 1, 5: 1, 9: 1,
    2: 0, 6: 0, 10: 0,
}
VARNA_NAMES = [
    Bilingual(en="Shudra", si="ශුද්‍ර"),
    Bilingual(en="Vaishya", si="වෛශ්‍ය"),
    Bilingual(en="Kshatriya", si="ක්ෂත්‍රිය"),
    Bilingual(en="Brahmana", si="බ්‍රාහ්මණ"),
]

FRIENDS = {
    "sun": ({"moon", "mars", "jupiter"}, {"venus", "saturn"}),
    "moon": ({"sun", "mercury"}, set()),
    "mars": ({"sun", "moon", "jupiter"}, {"mercury"}),
    "mercury": ({"sun", "venus"}, {"moon"}),
    "jupiter": ({"sun", "moon", "mars"}, {"mercury", "venus"}),
    "venus": ({"mercury", "saturn"}, {"sun", "moon"}),
    "saturn": ({"mercury", "venus"}, {"sun", "moon", "mars"}),
}

KUJA_HOUSES = (1, 2, 4, 7, 8, 12)


class PorondamRequest(BaseModel):
    bride: BirthRequest
    groom: BirthRequest


class PersonMoon(BaseModel):
    name: str
    nakshatra: NakshatraInfo
    moon_rashi_index: int
    moon_rashi: Bilingual
    lagna_rashi_index: int
    lagna_rashi: Bilingual
    mars_house_from_lagna: int
    mars_house_from_moon: int
    kuja_dosha: bool
    utc_offset: str


class PorondamItem(BaseModel):
    key: str
    name: Bilingual
    passed: bool
    critical: bool = Field(description="A failure here is traditionally treated as serious")
    detail: Bilingual


class PorondamResponse(BaseModel):
    bride: PersonMoon
    groom: PersonMoon
    items: list[PorondamItem]
    passed: int
    total: int
    percentage: int
    kuja_dosha_note: Bilingual | None


def _person_moon(req: BirthRequest) -> PersonMoon:
    chart = calculate_chart(req.model_copy(update={"as_of": None}))
    mars = next(p for p in chart.planets if p.key == "mars")
    from_moon = whole_sign_house(mars.rashi_index, chart.moon_sign.rashi_index)
    return PersonMoon(
        name=chart.birth.name,
        nakshatra=chart.nakshatra,
        moon_rashi_index=chart.moon_sign.rashi_index,
        moon_rashi=chart.moon_sign.rashi,
        lagna_rashi_index=chart.lagna.rashi_index,
        lagna_rashi=chart.lagna.rashi,
        mars_house_from_lagna=mars.house,
        mars_house_from_moon=from_moon,
        kuja_dosha=mars.house in KUJA_HOUSES,
        utc_offset=chart.birth.utc_offset,
    )


def _item(key: str, en: str, si: str, passed: bool, detail_en: str, detail_si: str, critical: bool = False) -> PorondamItem:
    return PorondamItem(
        key=key, name=Bilingual(en=en, si=si), passed=passed, critical=critical,
        detail=Bilingual(en=detail_en, si=detail_si),
    )


def calculate_porondam(req: PorondamRequest) -> PorondamResponse:
    b, g = _person_moon(req.bride), _person_moon(req.groom)
    bn, gn = b.nakshatra.index, g.nakshatra.index
    count = ((gn - bn) % 27) + 1  # bride's star to groom's, inclusive
    rashi_count = ((g.moon_rashi_index - b.moon_rashi_index) % 12) + 1
    items: list[PorondamItem] = []

    # 1. Nakath (Dina)
    rem = count % 9
    ok = rem in (2, 4, 6, 8, 0)
    items.append(_item("nakath", "Nakath (Dina)", "නැකැත්", ok,
                       f"Count from bride's star to groom's is {count} (remainder {rem or 9} of 9).",
                       f"මනාලියගේ නැකතේ සිට මනාලයාගේ නැකතට ගණන {count} කි (9න් ඉතිරිය {rem or 9})."))

    # 2. Gana
    bg, gg = GANA[bn], GANA[gn]
    ok = bg == gg or {bg, gg} == {0, 1}
    items.append(_item("gana", "Gana", "ගණ", ok,
                       f"Bride {GANA_NAMES[bg].en}, groom {GANA_NAMES[gg].en}.",
                       f"මනාලිය {GANA_NAMES[bg].si} ගණ, මනාලයා {GANA_NAMES[gg].si} ගණ."))

    # 3. Mahendra
    ok = count in (4, 7, 10, 13, 16, 19, 22, 25)
    items.append(_item("mahendra", "Mahendra", "මහේන්ද්‍ර", ok,
                       f"Star count {count}; favourable counts are 4, 7, 10, 13, 16, 19, 22, 25.",
                       f"නැකැත් ගණන {count}; සුබ ගණන් 4, 7, 10, 13, 16, 19, 22, 25 වේ."))

    # 4. Stree Deergha
    ok = count > 13
    items.append(_item("stree_deergha", "Stree Deergha", "ස්ත්‍රී දීර්ඝ", ok,
                       f"Groom's star is {count} from the bride's; more than 13 is favourable.",
                       f"මනාලයාගේ නැකත මනාලියගේ නැකතේ සිට {count} වැන්නයි; 13ට වැඩි වීම සුබයි."))

    # 5. Yoni
    by, gy = YONI[bn], YONI[gn]
    ok = frozenset((by, gy)) not in YONI_ENEMIES
    items.append(_item("yoni", "Yoni", "යෝනි", ok,
                       f"Bride {YONI_NAMES[by].en}, groom {YONI_NAMES[gy].en}{' — natural enemies' if not ok else ''}.",
                       f"මනාලිය {YONI_NAMES[by].si} යෝනි, මනාලයා {YONI_NAMES[gy].si} යෝනි{' — ස්වභාවික සතුරන්' if not ok else ''}."))

    # 6. Rashi
    ok = rashi_count not in (2, 6, 8, 12)
    items.append(_item("rashi", "Rashi", "රාශි", ok,
                       f"Groom's Moon sign is {rashi_count} from the bride's; 2/12 and 6/8 placements are avoided.",
                       f"මනාලයාගේ චන්ද්‍ර රාශිය මනාලියගේ රාශියෙන් {rashi_count} වැන්නයි; 2/12 සහ 6/8 පිහිටීම් අසුබයි."))

    # 7. Rashyadhipathi (lords of the Moon signs)
    bl, gl = RASHIS[b.moon_rashi_index]["lord"], RASHIS[g.moon_rashi_index]["lord"]
    enemy = gl in FRIENDS[bl][1] or bl in FRIENDS[gl][1]
    ok = bl == gl or not enemy
    items.append(_item("rashyadhipathi", "Rashyadhipathi", "රාශ්‍යාධිපති", ok,
                       f"Lords {PLANETS[bl]['en']} and {PLANETS[gl]['en']} are {'enemies' if enemy else 'friendly or neutral'}.",
                       f"අධිපතීන් {PLANETS[bl]['si']} සහ {PLANETS[gl]['si']} {'සතුරු' if enemy else 'මිත්‍ර හෝ සම'} වේ."))

    # 8. Vashya
    ok = g.moon_rashi_index in VASHYA[b.moon_rashi_index] or b.moon_rashi_index in VASHYA[g.moon_rashi_index]
    items.append(_item("vashya", "Vashya", "වශ්‍ය", ok,
                       "The Moon signs attract each other." if ok else "Neither Moon sign is vashya to the other.",
                       "චන්ද්‍ර රාශි එකිනෙකට වශ්‍ය වේ." if ok else "චන්ද්‍ර රාශි එකිනෙකට වශ්‍ය නොවේ."))

    # 9. Rajju (critical)
    br, gr = RAJJU[bn], RAJJU[gn]
    ok = br != gr
    items.append(_item("rajju", "Rajju", "රජ්ජු", ok,
                       f"Bride {RAJJU_NAMES[br].en}, groom {RAJJU_NAMES[gr].en}{' — same rajju' if not ok else ''}.",
                       f"මනාලිය {RAJJU_NAMES[br].si} රජ්ජු, මනාලයා {RAJJU_NAMES[gr].si} රජ්ජු{' — එකම රජ්ජුවයි' if not ok else ''}.",
                       critical=True))

    # 10. Vedha (critical)
    ok = frozenset((bn, gn)) not in VEDHA_PAIRS
    items.append(_item("vedha", "Vedha", "වේධ", ok,
                       "The birth stars do not afflict each other." if ok else "The birth stars are a Vedha (mutually afflicting) pair.",
                       "උපන් නැකැත් එකිනෙකට වේධ නොවේ." if ok else "උපන් නැකැත් දෙක වේධ (එකිනෙකට පීඩාකාරී) යුගලයකි.",
                       critical=True))

    # 11. Nadi (critical)
    bd, gd = NADI[bn], NADI[gn]
    ok = bd != gd
    items.append(_item("nadi", "Nadi", "නාඩි", ok,
                       f"Bride {NADI_NAMES[bd].en}, groom {NADI_NAMES[gd].en}{' — same nadi' if not ok else ''}.",
                       f"මනාලිය {NADI_NAMES[bd].si} නාඩි, මනාලයා {NADI_NAMES[gd].si} නාඩි{' — එකම නාඩියයි' if not ok else ''}.",
                       critical=True))

    # 12. Varna
    bv, gv = VARNA[b.moon_rashi_index], VARNA[g.moon_rashi_index]
    ok = gv >= bv
    items.append(_item("varna", "Varna", "වර්ණ", ok,
                       f"Bride {VARNA_NAMES[bv].en}, groom {VARNA_NAMES[gv].en}.",
                       f"මනාලිය {VARNA_NAMES[bv].si} වර්ණ, මනාලයා {VARNA_NAMES[gv].si} වර්ණ."))

    passed = sum(1 for i in items if i.passed)
    note = None
    if b.kuja_dosha and g.kuja_dosha:
        note = Bilingual(en="Both charts have Kuja Dosha, which traditionally cancels out (Kuja Dosha Samya).",
                         si="දෙදෙනාගේම කේන්දරවල කුජ දෝෂය ඇති බැවින් එය සම්ප්‍රදායිකව සමනය වේ (කුජ දෝෂ සාම්‍යය).")
    elif b.kuja_dosha or g.kuja_dosha:
        who_en = "the bride's" if b.kuja_dosha else "the groom's"
        who_si = "මනාලියගේ" if b.kuja_dosha else "මනාලයාගේ"
        note = Bilingual(en=f"Kuja Dosha is present in {who_en} chart only; consult an astrologer about remedies.",
                         si=f"කුජ දෝෂය ඇත්තේ {who_si} කේන්දරයේ පමණි; ශාන්තිකර්ම පිළිබඳ ජ්‍යොතිෂවේදියෙකුගෙන් විමසන්න.")

    return PorondamResponse(
        bride=b, groom=g, items=items, passed=passed, total=len(items),
        percentage=round(passed * 100 / len(items)), kuja_dosha_note=note,
    )


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Handahana Calculation Service",
    version="1.0.0",
    description="Sidereal (Lahiri) Sri Lankan horoscope calculations using Swiss Ephemeris.",
)

_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "swisseph": swe.version, "ephemeris": "swieph" if _EPHE_FLAG == swe.FLG_SWIEPH else "moshier"}


@app.post("/api/chart", response_model=ChartResponse)
def chart(req: BirthRequest) -> ChartResponse:
    try:
        return calculate_chart(req)
    except swe.Error as exc:  # ephemeris range or calculation failure
        raise HTTPException(status_code=422, detail=f"Ephemeris calculation failed: {exc}") from exc


@app.post("/api/porondam", response_model=PorondamResponse)
def porondam(req: PorondamRequest) -> PorondamResponse:
    try:
        return calculate_porondam(req)
    except swe.Error as exc:
        raise HTTPException(status_code=422, detail=f"Ephemeris calculation failed: {exc}") from exc


@app.get("/api/daily-transits", response_model=DailyTransits)
def daily_transits(day: date | None = None) -> DailyTransits:
    """Today's (or `?day=YYYY-MM-DD`) Gocharaya, Nakshatra and Rahu Kalaya for Sri Lanka."""
    target = day or datetime.now(COLOMBO).date()
    if not 1900 <= target.year <= 2100:
        raise HTTPException(status_code=422, detail="day must be between 1900 and 2100")
    try:
        return calculate_daily_transits(target)
    except swe.Error as exc:
        raise HTTPException(status_code=422, detail=f"Ephemeris calculation failed: {exc}") from exc
