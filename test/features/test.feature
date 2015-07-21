Feature: Plugin works

  Scenario: It should not really do much
    Given 3 seconds has passed
    When the user goes to the home page
    Then the todo list is present
    
  Scenario: It should continue doing nothing
    Given 1 second has passed
    When the user goes to the home page
    Then the todo list is present