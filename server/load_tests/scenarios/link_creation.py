from locust import HttpUser, between


class LinkCreationUser(HttpUser):
    """
    Simulates an user creating links.
    """

    wait_time = between(1, 5)
