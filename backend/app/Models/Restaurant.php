<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'whatsapp_number',
        'logo_url',
        'banner_url',
        'accent_color',
        'social_links',
        'bio',
        'address',
        'theme_color',
        'is_active',
    ];

    protected $casts = [
        'social_links' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class)->orderBy('sort_order');
    }
}
