<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantView extends Model
{
    protected $fillable = ['restaurant_id', 'ip_address', 'user_agent'];
}
