from rinku.models import User, Session

class RequestContext:
  user: User
  session: Session

  def __init__(self, user: User, session: Session) -> None:
    self.user = user
    self.session = session