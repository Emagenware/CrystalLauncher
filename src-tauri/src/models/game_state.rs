use std::sync::Mutex;

pub struct RunningGame(pub Mutex<Option<String>>);

impl RunningGame {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}
