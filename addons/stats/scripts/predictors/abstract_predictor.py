# coding:utf-8
from abc import ABCMeta, abstractmethod


class AbstractPredictor(metaclass=ABCMeta):
    @classmethod
    @abstractmethod
    def predicate(cls, tasks, user_id, cost):
        pass
