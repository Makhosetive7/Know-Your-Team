import uuid
from typing import TypedDict


class SeedActivity(TypedDict):
    id: uuid.UUID
    title: str
    instructions: str
    category: str
    estimated_minutes: int
    is_active: bool


def seed_activity_id(slug: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"knowyourteam.activity.{slug}")


SEED_ACTIVITIES: list[SeedActivity] = [
    {
        "id": seed_activity_id("two-truths"),
        "title": "Two truths and a lie",
        "instructions": (
            "Share three statements about yourself. Two are true and one is a lie. "
            "Invite teammates to guess which one is the lie."
        ),
        "category": "icebreaker",
        "estimated_minutes": 5,
        "is_active": True,
    },
    {
        "id": seed_activity_id("desert-island"),
        "title": "Desert island soundtrack",
        "instructions": (
            "Name one song you would bring to a desert island and why it made the cut."
        ),
        "category": "fun",
        "estimated_minutes": 3,
        "is_active": True,
    },
    {
        "id": seed_activity_id("win-of-the-week"),
        "title": "Win of the week",
        "instructions": (
            "Share a small win from this week. It can be work-related or personal, "
            "and it does not have to be impressive."
        ),
        "category": "appreciation",
        "estimated_minutes": 3,
        "is_active": True,
    },
    {
        "id": seed_activity_id("desk-companion"),
        "title": "Desk companion",
        "instructions": (
            "Tell the team about an object on your desk or in your workspace that you "
            "would miss if it disappeared."
        ),
        "category": "icebreaker",
        "estimated_minutes": 3,
        "is_active": True,
    },
    {
        "id": seed_activity_id("unsung-tool"),
        "title": "Unsung tool",
        "instructions": ("Name a tool, shortcut, or habit that quietly makes your workday easier."),
        "category": "reflection",
        "estimated_minutes": 3,
        "is_active": True,
    },
    {
        "id": seed_activity_id("quiet-thanks"),
        "title": "Quiet thanks",
        "instructions": (
            "Appreciate a teammate for something specific they did recently. Keep it "
            "about the action, not a ranking."
        ),
        "category": "appreciation",
        "estimated_minutes": 3,
        "is_active": True,
    },
    {
        "id": seed_activity_id("first-job"),
        "title": "First job flashback",
        "instructions": "What was your first paid job, and what did it teach you?",
        "category": "icebreaker",
        "estimated_minutes": 5,
        "is_active": True,
    },
    {
        "id": seed_activity_id("better-meeting"),
        "title": "Better meeting one-liner",
        "instructions": (
            "Share one sentence that would make meetings on this team more useful or kinder."
        ),
        "category": "reflection",
        "estimated_minutes": 3,
        "is_active": True,
    },
]
