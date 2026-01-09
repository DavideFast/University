# PINGTIME



PingTime is an application developed for the "Models and Alghoritms For Data Visualization" exam.

> [!NOTE]
> This project is made by Mirko Bruschi, Michele Dalmonte and me.
> These version is the exam one, but the project is evolving, check for last release here: https://github.com/0101mirko1010/PingTimeVis

# INTRODUCTION

This project was designed for a table tennis club. The app's goal is to provide the club with tools to efficiently analyze attendance, absences, and cancellations, maximizing time slot utilization and promoting better training through informed matchmaking.

There are two main categories of users PingTime is aimed at:

- Company Boards
- Coaches

# DATA MODELLING

### DATA GATHERING AND DATA EXTRACTION

This two parts are interely carried by the Backend Part of the application. In fact the data are very structured data stored in a real relational database.

### DATA CLEANING

This part is carried by the Backend API. The API return only the desired data.

### DATA TRASFORMATION

This part is provided from both the Backend and Frontend. An example of the transformation is the aggregation of attendance in a certain time period.

### DATA TYPES AND DATASET TYPES

The data types are for the major part quantitative, but the are also categorical data.
There are instead two types of dataset and in particular tables and network ones.

# TASK MODELLING

The application could handle these task:

- Find empty interval time in the gym
-
-
-
-
-
-

# VISUALIZATION DESIGN

The visual idioms choose for this application are mainly three:

- Calendar HeatMap
- Line Chart
- Radial Chart

#### Calendar HeatMap

It is a bidimensional Chart which have on the X-Axis the hours of a day and on the Y-Axis the week days, the month weeks or the year months depend on the type of resolution is necessary.

#### Line Chart

In this visual idiom on the x-Axis there are the weeks and on the y-Axis the quantitative attribute of attendences, absences and cancellations.

#### Radial Chart

Here the angular position means nothing, while the radial distance from the origin simbolize the quantitative of heterogenous match played with different players in the week. An higher value of heterogenous match is a good value and it is displayed newar the origin while a bad value is displayed far from the origin.

# INTERACTION DESIGN

# EXAMPLES
